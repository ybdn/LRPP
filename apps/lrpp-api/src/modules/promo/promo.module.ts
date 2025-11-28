import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromoCode, UserPromoRedemption, User } from "@/common/entities";
import { PromoController } from "./promo.controller";
import { PromoService } from "./promo.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoCode, UserPromoRedemption, User]),
    AuthModule,
  ],
  controllers: [PromoController],
  providers: [PromoService],
  exports: [PromoService],
})
export class PromoModule {}
