import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
  Max,
} from "class-validator";
import { AttemptMode } from "@/common/entities";

export class CreateAttemptDto {
  @IsString()
  userId: string;

  @IsString()
  blockId: string;

  @IsString()
  @IsOptional()
  examSessionId?: string;

  @IsString()
  mode: AttemptMode;

  @IsNumber()
  @Min(1)
  @Max(3)
  level: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsObject()
  @IsOptional()
  answers?: Record<string, string>;
}
