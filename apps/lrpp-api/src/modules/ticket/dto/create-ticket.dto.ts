import {
  IsEnum,
  IsOptional,
  IsString,
  IsEmail,
  MaxLength,
  MinLength,
} from "class-validator";
import { TicketType, TicketSeverity } from "@/common/entities/ticket.entity";

export class CreateTicketDto {
  @IsEnum(TicketType)
  type: TicketType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsString()
  @MinLength(10)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pvId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  contextUrl?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reporterName?: string;

  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;
}
