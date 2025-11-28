import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { SupabaseService } from '../../../common/supabase/supabase.client';
import { UserService } from '../../user/user.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userService: UserService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.substring(7);
    const supabaseUser = await this.supabaseService.verifyToken(token);

    if (!supabaseUser) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userService.findOrCreateFromSupabase(
      supabaseUser.id,
      supabaseUser.email ?? null,
    );

    return user;
  }
}
