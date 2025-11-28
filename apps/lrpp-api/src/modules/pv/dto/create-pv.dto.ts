import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreatePvDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

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
