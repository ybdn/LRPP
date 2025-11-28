import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import {
  PromoService,
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
} from "./promo.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { User, PromoCodeType } from "@/common/entities";

declare module "express" {
  interface Request {
    user?: User;
  }
}

@Controller("promo-codes")
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  // ===== Admin Endpoints =====

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.promoService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param("id") id: string) {
    return this.promoService.findOne(id);
  }

  @Get(":id/stats")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getStats(@Param("id") id: string) {
    return this.promoService.getPromoStats(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promoService.create(dto);
  }

  @Post("generate")
  @UseGuards(JwtAuthGuard, AdminGuard)
  generateCode(@Body() body: { type: PromoCodeType }) {
    return { code: this.promoService.generateCode(body.type) };
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param("id") id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promoService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param("id") id: string) {
    return this.promoService.remove(id);
  }

  // ===== Public Endpoints =====

  @Get("validate/:code")
  async validateCode(@Param("code") code: string) {
    const result = await this.promoService.validateCode(code);
    return {
      valid: result.valid,
      reason: result.reason,
      type: result.promo?.type,
      durationDays: result.promo?.durationDays,
    };
  }

  @Post("redeem")
  @UseGuards(JwtAuthGuard)
  async redeem(@Body() body: { code: string }, @Req() req: Request) {
    if (!req.user) {
      throw new Error("User not found");
    }
    return this.promoService.redeem(body.code, req.user.id);
  }

  @Get("my-access")
  @UseGuards(JwtAuthGuard)
  async getMyAccess(@Req() req: Request) {
    if (!req.user) {
      return { hasAccess: false };
    }

    const redemption = await this.promoService.getActiveRedemption(req.user.id);

    if (!redemption) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      expiresAt: redemption.expiresAt,
      type: redemption.promoCode.type,
      redeemedAt: redemption.redeemedAt,
    };
  }
}
