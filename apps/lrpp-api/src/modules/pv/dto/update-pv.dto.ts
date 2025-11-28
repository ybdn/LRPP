import { IsString, IsBoolean, IsNumber, IsOptional } from "class-validator";

export class UpdatePvDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  hasNotification?: boolean;

  @IsBoolean()
  @IsOptional()
  hasDeroulement?: boolean;
}
