import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseService } from '../../common/supabase/supabase.client';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PassportModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy, SupabaseService],
  exports: [AuthService, SupabaseService],
})
export class AuthModule {}
