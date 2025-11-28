import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import {
  UserPvAccess,
  AnonymousAccess,
  User,
  SubscriptionTier,
  UserPromoRedemption,
} from "@/common/entities";

export const ACCESS_LIMITS = {
  ANONYMOUS: 1,
  FREE: 6,
  PREMIUM: Infinity,
} as const;

export interface AccessCheckResult {
  canAccess: boolean;
  reason?: "limit_reached" | "not_unlocked";
  currentCount: number;
  maxAllowed: number;
  accessedPvIds: string[];
  tier: "anonymous" | SubscriptionTier;
}

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UserPvAccess)
    private userPvAccessRepository: Repository<UserPvAccess>,
    @InjectRepository(AnonymousAccess)
    private anonymousAccessRepository: Repository<AnonymousAccess>,
    @InjectRepository(UserPromoRedemption)
    private promoRedemptionRepository: Repository<UserPromoRedemption>,
  ) {}

  async hasActivePromoAccess(userId: string): Promise<boolean> {
    const redemption = await this.promoRedemptionRepository.findOne({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
      },
    });
    return !!redemption;
  }

  async checkAccess(
    pvId: string,
    user?: User | null,
    ipAddress?: string,
    fingerprint?: string,
  ): Promise<AccessCheckResult> {
    // Premium users have unlimited access
    if (user?.subscriptionTier === SubscriptionTier.PREMIUM) {
      const accessedPvIds = await this.getUserAccessedPvIds(user.id);
      return {
        canAccess: true,
        currentCount: accessedPvIds.length,
        maxAllowed: ACCESS_LIMITS.PREMIUM,
        accessedPvIds,
        tier: SubscriptionTier.PREMIUM,
      };
    }

    // Check for active promo access (treated as premium)
    if (user && (await this.hasActivePromoAccess(user.id))) {
      const accessedPvIds = await this.getUserAccessedPvIds(user.id);
      return {
        canAccess: true,
        currentCount: accessedPvIds.length,
        maxAllowed: ACCESS_LIMITS.PREMIUM,
        accessedPvIds,
        tier: SubscriptionTier.PREMIUM,
      };
    }

    // Registered free users: 6 PVs
    if (user) {
      return this.checkUserAccess(pvId, user);
    }

    // Anonymous users: 1 PV (tracked by IP + fingerprint)
    if (ipAddress) {
      return this.checkAnonymousAccess(pvId, ipAddress, fingerprint);
    }

    return {
      canAccess: false,
      reason: "limit_reached",
      currentCount: 0,
      maxAllowed: 0,
      accessedPvIds: [],
      tier: "anonymous",
    };
  }

  private async checkUserAccess(
    pvId: string,
    user: User,
  ): Promise<AccessCheckResult> {
    const accessedPvIds = await this.getUserAccessedPvIds(user.id);
    const maxAllowed = ACCESS_LIMITS.FREE;

    // Already accessed this PV
    if (accessedPvIds.includes(pvId)) {
      return {
        canAccess: true,
        currentCount: accessedPvIds.length,
        maxAllowed,
        accessedPvIds,
        tier: SubscriptionTier.FREE,
      };
    }

    // Can access new PV if under limit
    if (accessedPvIds.length < maxAllowed) {
      return {
        canAccess: true,
        currentCount: accessedPvIds.length,
        maxAllowed,
        accessedPvIds,
        tier: SubscriptionTier.FREE,
      };
    }

    // Limit reached
    return {
      canAccess: false,
      reason: "limit_reached",
      currentCount: accessedPvIds.length,
      maxAllowed,
      accessedPvIds,
      tier: SubscriptionTier.FREE,
    };
  }

  private async checkAnonymousAccess(
    pvId: string,
    ipAddress: string,
    fingerprint?: string,
  ): Promise<AccessCheckResult> {
    const accessedPvIds = await this.getAnonymousAccessedPvIds(
      ipAddress,
      fingerprint,
    );
    const maxAllowed = ACCESS_LIMITS.ANONYMOUS;

    // Already accessed this PV
    if (accessedPvIds.includes(pvId)) {
      return {
        canAccess: true,
        currentCount: accessedPvIds.length,
        maxAllowed,
        accessedPvIds,
        tier: "anonymous",
      };
    }

    // Can access new PV if under limit
    if (accessedPvIds.length < maxAllowed) {
      return {
        canAccess: true,
        currentCount: accessedPvIds.length,
        maxAllowed,
        accessedPvIds,
        tier: "anonymous",
      };
    }

    // Limit reached
    return {
      canAccess: false,
      reason: "limit_reached",
      currentCount: accessedPvIds.length,
      maxAllowed,
      accessedPvIds,
      tier: "anonymous",
    };
  }

  async recordAccess(
    pvId: string,
    user?: User | null,
    ipAddress?: string,
    fingerprint?: string,
  ): Promise<void> {
    if (user) {
      await this.recordUserAccess(pvId, user.id);
    } else if (ipAddress) {
      await this.recordAnonymousAccess(pvId, ipAddress, fingerprint);
    }
  }

  private async recordUserAccess(pvId: string, userId: string): Promise<void> {
    const existing = await this.userPvAccessRepository.findOne({
      where: { userId, pvId },
    });

    if (!existing) {
      await this.userPvAccessRepository.save({
        userId,
        pvId,
      });
    }
  }

  private async recordAnonymousAccess(
    pvId: string,
    ipAddress: string,
    fingerprint?: string,
  ): Promise<void> {
    const existing = await this.anonymousAccessRepository.findOne({
      where: { ipAddress, pvId },
    });

    if (!existing) {
      await this.anonymousAccessRepository.save({
        ipAddress,
        pvId,
        fingerprint,
      });
    }
  }

  async getUserAccessedPvIds(userId: string): Promise<string[]> {
    const accesses = await this.userPvAccessRepository.find({
      where: { userId },
      select: ["pvId"],
    });
    return accesses.map((a) => a.pvId);
  }

  async getAnonymousAccessedPvIds(
    ipAddress: string,
    fingerprint?: string,
  ): Promise<string[]> {
    // Check both by IP and fingerprint for stronger tracking
    const byIp = await this.anonymousAccessRepository.find({
      where: { ipAddress },
      select: ["pvId"],
    });

    const pvIds = new Set(byIp.map((a) => a.pvId));

    if (fingerprint) {
      const byFingerprint = await this.anonymousAccessRepository.find({
        where: { fingerprint },
        select: ["pvId"],
      });
      byFingerprint.forEach((a) => pvIds.add(a.pvId));
    }

    return Array.from(pvIds);
  }

  async getAccessStatus(
    user?: User | null,
    ipAddress?: string,
    fingerprint?: string,
  ): Promise<{
    tier: "anonymous" | SubscriptionTier;
    currentCount: number;
    maxAllowed: number;
    accessedPvIds: string[];
  }> {
    if (user?.subscriptionTier === SubscriptionTier.PREMIUM) {
      const accessedPvIds = await this.getUserAccessedPvIds(user.id);
      return {
        tier: SubscriptionTier.PREMIUM,
        currentCount: accessedPvIds.length,
        maxAllowed: ACCESS_LIMITS.PREMIUM,
        accessedPvIds,
      };
    }

    // Check for active promo access
    if (user && (await this.hasActivePromoAccess(user.id))) {
      const accessedPvIds = await this.getUserAccessedPvIds(user.id);
      return {
        tier: SubscriptionTier.PREMIUM,
        currentCount: accessedPvIds.length,
        maxAllowed: ACCESS_LIMITS.PREMIUM,
        accessedPvIds,
      };
    }

    if (user) {
      const accessedPvIds = await this.getUserAccessedPvIds(user.id);
      return {
        tier: SubscriptionTier.FREE,
        currentCount: accessedPvIds.length,
        maxAllowed: ACCESS_LIMITS.FREE,
        accessedPvIds,
      };
    }

    if (ipAddress) {
      const accessedPvIds = await this.getAnonymousAccessedPvIds(
        ipAddress,
        fingerprint,
      );
      return {
        tier: "anonymous",
        currentCount: accessedPvIds.length,
        maxAllowed: ACCESS_LIMITS.ANONYMOUS,
        accessedPvIds,
      };
    }

    return {
      tier: "anonymous",
      currentCount: 0,
      maxAllowed: ACCESS_LIMITS.ANONYMOUS,
      accessedPvIds: [],
    };
  }
}
