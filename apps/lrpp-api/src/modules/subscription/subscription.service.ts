import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, SubscriptionTier } from "@/common/entities";
import * as crypto from "crypto";

// Lemon Squeezy webhook event types
export type LemonSqueezyEventType =
  | "order_created"
  | "order_refunded"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed";

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: LemonSqueezyEventType;
    custom_data?: {
      user_id?: string;
      user_email?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      user_email: string;
      user_name: string;
      customer_id: number;
      product_id: number;
      variant_id: number;
      order_id?: number;
      subscription_id?: number;
      ends_at?: string;
      renews_at?: string;
      created_at: string;
      updated_at: string;
    };
  };
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  async handleWebhook(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const eventName = payload.meta.event_name;
    const { attributes } = payload.data;

    this.logger.log(`Processing Lemon Squeezy event: ${eventName}`);

    // Get user by email from webhook or custom_data
    const userEmail =
      payload.meta.custom_data?.user_email || attributes.user_email;

    if (!userEmail) {
      this.logger.warn("No user email found in webhook payload");
      return;
    }

    const user = await this.userRepository.findOne({
      where: { email: userEmail },
    });

    if (!user) {
      this.logger.warn(`User not found for email: ${userEmail}`);
      return;
    }

    switch (eventName) {
      case "order_created":
      case "subscription_created":
      case "subscription_resumed":
      case "subscription_unpaused":
      case "subscription_payment_success":
        await this.upgradeToPremium(user);
        break;

      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused":
      case "order_refunded":
        await this.downgradeToFree(user);
        break;

      case "subscription_updated":
        // Check status and upgrade/downgrade accordingly
        if (
          attributes.status === "active" ||
          attributes.status === "on_trial"
        ) {
          await this.upgradeToPremium(user);
        } else {
          await this.downgradeToFree(user);
        }
        break;

      case "subscription_payment_failed":
        // Optionally send notification but don't downgrade yet
        // (Lemon Squeezy will handle retry logic)
        this.logger.warn(`Payment failed for user: ${userEmail}`);
        break;

      default:
        this.logger.log(`Unhandled event type: ${eventName}`);
    }
  }

  async upgradeToPremium(user: User): Promise<void> {
    if (user.subscriptionTier === SubscriptionTier.PREMIUM) {
      this.logger.log(`User ${user.email} is already premium`);
      return;
    }

    await this.userRepository.update(user.id, {
      subscriptionTier: SubscriptionTier.PREMIUM,
    });

    this.logger.log(`User ${user.email} upgraded to premium`);
  }

  async downgradeToFree(user: User): Promise<void> {
    if (user.subscriptionTier === SubscriptionTier.FREE) {
      this.logger.log(`User ${user.email} is already free`);
      return;
    }

    await this.userRepository.update(user.id, {
      subscriptionTier: SubscriptionTier.FREE,
    });

    this.logger.log(`User ${user.email} downgraded to free`);
  }

  async getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.subscriptionTier || SubscriptionTier.FREE;
  }

  async manualUpgrade(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    await this.upgradeToPremium(user);
    return { success: true, message: `User ${email} upgraded to premium` };
  }

  async manualDowngrade(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    await this.downgradeToFree(user);
    return { success: true, message: `User ${email} downgraded to free` };
  }
}
