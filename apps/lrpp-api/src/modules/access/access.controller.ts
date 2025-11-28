import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Headers,
  ForbiddenException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AccessService } from "./access.service";
import { User } from "@/common/entities";
import { OptionalAuthGuard } from "../auth/guards/optional-auth.guard";

// Extend Express Request to include user
declare module "express" {
  interface Request {
    user?: User;
  }
}

@Controller("access")
@UseGuards(OptionalAuthGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  private getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  }

  @Get("status")
  async getStatus(
    @Req() req: Request,
    @Headers("x-fingerprint") fingerprint?: string,
  ) {
    const ipAddress = this.getClientIp(req);
    const user = req.user;

    return this.accessService.getAccessStatus(user, ipAddress, fingerprint);
  }

  @Get("check/:pvId")
  async checkAccess(
    @Param("pvId") pvId: string,
    @Req() req: Request,
    @Headers("x-fingerprint") fingerprint?: string,
  ) {
    const ipAddress = this.getClientIp(req);
    const user = req.user;

    return this.accessService.checkAccess(pvId, user, ipAddress, fingerprint);
  }

  @Post("record/:pvId")
  async recordAccess(
    @Param("pvId") pvId: string,
    @Req() req: Request,
    @Headers("x-fingerprint") fingerprint?: string,
  ) {
    const ipAddress = this.getClientIp(req);
    const user = req.user;

    // First check if access is allowed
    const accessCheck = await this.accessService.checkAccess(
      pvId,
      user,
      ipAddress,
      fingerprint,
    );

    if (!accessCheck.canAccess) {
      throw new ForbiddenException({
        message: "Access limit reached",
        ...accessCheck,
      });
    }

    // Record the access
    await this.accessService.recordAccess(pvId, user, ipAddress, fingerprint);

    return {
      success: true,
      ...accessCheck,
      currentCount: accessCheck.accessedPvIds.includes(pvId)
        ? accessCheck.currentCount
        : accessCheck.currentCount + 1,
    };
  }
}
