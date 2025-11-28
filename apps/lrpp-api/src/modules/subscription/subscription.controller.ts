import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Get,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import {
  SubscriptionService,
  LemonSqueezyWebhookPayload,
} from "./subscription.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("subscription")
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  @Post("webhook/lemonsqueezy")
  @HttpCode(HttpStatus.OK)
  async handleLemonSqueezyWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-signature") signature: string,
    @Body() payload: LemonSqueezyWebhookPayload,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get<string>(
      "LEMONSQUEEZY_WEBHOOK_SECRET",
    );

    if (!webhookSecret) {
      throw new UnauthorizedException("Webhook secret not configured");
    }

    // Get raw body for signature verification
    const rawBody = req.rawBody?.toString() || JSON.stringify(payload);

    // Verify signature
    const isValid = this.subscriptionService.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    // Process the webhook
    await this.subscriptionService.handleWebhook(payload);

    return { received: true };
  }

  // Admin endpoints for manual subscription management

  @Post("admin/upgrade")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminUpgrade(
    @Body() body: { email: string },
  ): Promise<{ success: boolean; message: string }> {
    return this.subscriptionService.manualUpgrade(body.email);
  }

  @Post("admin/downgrade")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminDowngrade(
    @Body() body: { email: string },
  ): Promise<{ success: boolean; message: string }> {
    return this.subscriptionService.manualDowngrade(body.email);
  }

  @Get("checkout-url")
  getCheckoutUrl(): { url: string | null } {
    const checkoutUrl = this.configService.get<string>(
      "LEMONSQUEEZY_CHECKOUT_URL",
    );
    return { url: checkoutUrl || null };
  }
}
