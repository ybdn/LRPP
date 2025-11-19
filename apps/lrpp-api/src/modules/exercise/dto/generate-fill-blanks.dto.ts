import { IsString, IsNumber, Min, Max } from 'class-validator';

export class GenerateFillBlanksDto {
  @IsString()
  pvId: string;

  @IsNumber()
  @Min(1)
  @Max(3)
  level: number;
}
