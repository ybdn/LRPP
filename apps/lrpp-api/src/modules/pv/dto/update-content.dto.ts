import { IsString, IsOptional } from "class-validator";

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  cadreLegal?: string;

  @IsString()
  @IsOptional()
  motivation?: string;

  @IsString()
  @IsOptional()
  notification?: string;

  @IsString()
  @IsOptional()
  deroulement?: string;

  @IsString()
  @IsOptional()
  elementsFond?: string;

  @IsString()
  @IsOptional()
  frameworkId?: string;
}
