import { IsString, IsObject, IsOptional, IsArray } from 'class-validator';

export class CheckAnswersDto {
  @IsString()
  blockId: string;

  @IsObject()
  answers: Record<string, string>;

  @IsOptional()
  @IsArray()
  targetBlankIds?: string[];
}
