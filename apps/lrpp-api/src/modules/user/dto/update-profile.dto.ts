import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  studyGoal?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}
