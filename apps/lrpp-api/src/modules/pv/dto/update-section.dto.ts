import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
