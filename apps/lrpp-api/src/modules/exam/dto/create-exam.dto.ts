import { IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';

export class CreateExamDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsArray()
  @IsString({ each: true })
  themes: string[];

  @IsNumber()
  @IsOptional()
  blockCount?: number;
}
