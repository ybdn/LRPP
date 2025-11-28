import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { TicketService } from "./ticket.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AuthService } from "../auth/auth.service";

@Controller("tickets")
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTicketDto,
    @Headers("authorization") authorization?: string,
  ) {
    let user = null;
    if (authorization && authorization.startsWith("Bearer ")) {
      const token = authorization.substring(7);
      try {
        const validated = await this.authService.validateToken(token);
        user = validated.user;
      } catch {
        // ignore invalid token to allow anonymous reports
      }
    }

    return this.ticketService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll() {
    return this.ticketService.findAll();
  }

  @Put(":id/status")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketService.updateStatus(id, dto);
  }
}
