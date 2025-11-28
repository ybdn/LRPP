import { IsString, IsOptional } from "class-validator";

export class UpdateFrameworkDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cadreLegal?: string;

  @IsString()
  @IsOptional()
  justification?: string;

  @IsString()
  @IsOptional()
  competence?: string;
}
