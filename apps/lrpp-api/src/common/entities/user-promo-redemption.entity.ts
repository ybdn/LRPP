import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";
import { PromoCode } from "./promo-code.entity";

@Entity("user_promo_redemptions")
@Unique(["user", "promoCode"])
export class UserPromoRedemption {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => PromoCode, (promo) => promo.redemptions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "promo_code_id" })
  promoCode: PromoCode;

  @Column({ name: "promo_code_id" })
  promoCodeId: string;

  @CreateDateColumn({ name: "redeemed_at" })
  redeemedAt: Date;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt: Date;
}
