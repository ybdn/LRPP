import { IsEnum, IsOptional } from "class-validator";
import { TicketStatus, TicketSeverity } from "@/common/entities/ticket.entity";

export class UpdateTicketDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;
}
