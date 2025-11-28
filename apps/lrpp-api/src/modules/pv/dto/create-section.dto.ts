import { IsString, IsNumber, IsOptional } from "class-validator";

export class CreateSectionDto {
  @IsString()
  pvId: string;

  @IsString()
  label: string;

  @IsString()
  title: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
