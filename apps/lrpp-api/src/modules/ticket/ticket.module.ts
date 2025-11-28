import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Ticket } from "@/common/entities";
import { TicketService } from "./ticket.service";
import { TicketController } from "./ticket.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), AuthModule],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
