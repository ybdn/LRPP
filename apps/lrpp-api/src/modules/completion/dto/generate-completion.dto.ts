import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { SectionKind, TrainingMode } from "../completion.types";

export class GenerateCompletionDto {
  @IsString()
  pvId: string;

  @IsEnum(TrainingMode)
  mode: TrainingMode;

  @IsOptional()
  level?: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsArray()
  sections?: SectionKind[];
}
