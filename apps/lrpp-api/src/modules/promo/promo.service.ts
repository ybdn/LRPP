import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import {
  PromoCode,
  PromoCodeType,
  PROMO_TYPE_DEFAULTS,
  UserPromoRedemption,
  User,
  SubscriptionTier,
} from "@/common/entities";

export interface CreatePromoCodeDto {
  code?: string;
  type: PromoCodeType;
  description?: string;
  durationDays?: number;
  maxUses?: number;
  expiresAt?: Date;
}

export interface UpdatePromoCodeDto {
  description?: string;
  durationDays?: number;
  maxUses?: number;
  expiresAt?: Date;
  isActive?: boolean;
}

@Injectable()
export class PromoService {
  constructor(
    @InjectRepository(PromoCode)
    private promoCodeRepository: Repository<PromoCode>,
    @InjectRepository(UserPromoRedemption)
    private redemptionRepository: Repository<UserPromoRedemption>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  generateCode(type: PromoCodeType): string {
    const prefix = type.toUpperCase();
    const length = type === PromoCodeType.LICENSE ? 8 : 6;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  }

  async findAll(): Promise<PromoCode[]> {
    return this.promoCodeRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<PromoCode> {
    const promo = await this.promoCodeRepository.findOne({ where: { id } });
    if (!promo) {
      throw new NotFoundException("Code promo non trouvé");
    }
    return promo;
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    return this.promoCodeRepository.findOne({
      where: { code: code.toUpperCase() },
    });
  }

  async create(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const code = dto.code?.toUpperCase() || this.generateCode(dto.type);

    // Check if code already exists
    const existing = await this.findByCode(code);
    if (existing) {
      throw new ConflictException("Ce code existe déjà");
    }

    const defaults = PROMO_TYPE_DEFAULTS[dto.type];
    const promo = this.promoCodeRepository.create({
      code,
      type: dto.type,
      description: dto.description,
      durationDays: dto.durationDays ?? defaults.durationDays,
      maxUses: dto.maxUses,
      expiresAt: dto.expiresAt,
      isActive: true,
      usedCount: 0,
    });

    return this.promoCodeRepository.save(promo);
  }

  async update(id: string, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const promo = await this.findOne(id);

    Object.assign(promo, dto);

    return this.promoCodeRepository.save(promo);
  }

  async remove(id: string): Promise<void> {
    const promo = await this.findOne(id);
    await this.promoCodeRepository.remove(promo);
  }

  async validateCode(code: string): Promise<{
    valid: boolean;
    reason?: string;
    promo?: PromoCode;
  }> {
    const promo = await this.findByCode(code);

    if (!promo) {
      return { valid: false, reason: "Code invalide" };
    }

    if (!promo.isActive) {
      return { valid: false, reason: "Ce code n'est plus actif" };
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return { valid: false, reason: "Ce code a expiré" };
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return {
        valid: false,
        reason: "Ce code a atteint sa limite d'utilisation",
      };
    }

    return { valid: true, promo };
  }

  async redeem(
    code: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
    const validation = await this.validateCode(code);

    if (!validation.valid || !validation.promo) {
      throw new BadRequestException(validation.reason);
    }

    const promo = validation.promo;

    // Check if user already used this code
    const existingRedemption = await this.redemptionRepository.findOne({
      where: { userId, promoCodeId: promo.id },
    });

    if (existingRedemption) {
      throw new BadRequestException("Vous avez déjà utilisé ce code");
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + promo.durationDays);

    // Create redemption
    const redemption = this.redemptionRepository.create({
      userId,
      promoCodeId: promo.id,
      expiresAt,
    });

    await this.redemptionRepository.save(redemption);

    // Update user subscription tier to PREMIUM
    await this.userRepository.update(userId, {
      subscriptionTier: SubscriptionTier.PREMIUM,
    });

    // Increment usage count
    await this.promoCodeRepository.update(promo.id, {
      usedCount: promo.usedCount + 1,
    });

    const typeLabel = PROMO_TYPE_DEFAULTS[promo.type].label;

    return {
      success: true,
      message: `Code ${typeLabel} activé ! Accès Premium jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}`,
      expiresAt,
    };
  }

  async getActiveRedemption(
    userId: string,
  ): Promise<UserPromoRedemption | null> {
    return this.redemptionRepository.findOne({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
      },
      relations: ["promoCode"],
      order: { expiresAt: "DESC" },
    });
  }

  async hasActivePromoAccess(userId: string): Promise<boolean> {
    const redemption = await this.getActiveRedemption(userId);
    return !!redemption;
  }

  async getPromoStats(id: string): Promise<{
    promo: PromoCode;
    redemptions: UserPromoRedemption[];
    activeCount: number;
  }> {
    const promo = await this.findOne(id);

    const redemptions = await this.redemptionRepository.find({
      where: { promoCodeId: id },
      relations: ["user"],
      order: { redeemedAt: "DESC" },
    });

    const activeCount = redemptions.filter(
      (r) => new Date(r.expiresAt) > new Date(),
    ).length;

    return { promo, redemptions, activeCount };
  }
}
