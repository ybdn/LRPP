import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { UserPromoRedemption } from "./user-promo-redemption.entity";

export enum PromoCodeType {
  BETA = "beta",
  DEMO = "demo",
  LICENSE = "license",
}

export const PROMO_TYPE_DEFAULTS = {
  [PromoCodeType.BETA]: { label: "Beta Test", durationDays: 30 },
  [PromoCodeType.DEMO]: { label: "Démo", durationDays: 7 },
  [PromoCodeType.LICENSE]: { label: "Licence", durationDays: 365 },
};

@Entity("promo_codes")
export class PromoCode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  code: string;

  @Column({
    type: "varchar",
    length: 20,
    default: PromoCodeType.BETA,
  })
  type: PromoCodeType;

  @Column({ type: "varchar", length: 200, nullable: true })
  description: string | null;

  @Column({ name: "duration_days", type: "int" })
  durationDays: number;

  @Column({ name: "max_uses", type: "int", nullable: true })
  maxUses: number | null;

  @Column({ name: "used_count", type: "int", default: 0 })
  usedCount: number;

  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expiresAt: Date | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => UserPromoRedemption, (redemption) => redemption.promoCode)
  redemptions: UserPromoRedemption[];
}
