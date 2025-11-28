import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.client';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userService: UserService,
  ) {}

  async validateToken(token: string) {
    const supabaseUser = await this.supabaseService.verifyToken(token);

    if (!supabaseUser) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userService.findOrCreateFromSupabase(
      supabaseUser.id,
      supabaseUser.email,
    );

    return {
      user,
      supabaseUser,
    };
  }

  async getProfile(token: string) {
    const { user } = await this.validateToken(token);
    return user;
  }
}
