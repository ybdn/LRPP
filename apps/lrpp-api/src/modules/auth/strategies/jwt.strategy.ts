import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, SecretOrKeyProvider } from 'passport-jwt';
import { Request } from 'express';
import { SupabaseService } from '../../../common/supabase/supabase.client';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (
        _request: Request,
        rawJwtToken: string,
        done: (err: Error | null, secret: string | Buffer | undefined) => void,
      ) => {
        try {
          const supabaseUser = await supabaseService.verifyToken(rawJwtToken);
          if (!supabaseUser) {
            return done(new UnauthorizedException('Invalid token'), undefined);
          }
          // Supabase handles JWT verification, we just need to pass validation
          done(null, process.env.SUPABASE_JWT_SECRET || 'dummy-secret');
        } catch (error) {
          done(error instanceof Error ? error : new Error(String(error)), undefined);
        }
      },
    });
  }

  async validate(payload: any) {
    const supabaseUser = await this.supabaseService.verifyToken(
      payload.access_token,
    );

    if (!supabaseUser) {
      throw new UnauthorizedException('Invalid token');
    }

    // Find or create user in our database
    const user = await this.userService.findOrCreateFromSupabase(
      supabaseUser.id,
      supabaseUser.email ?? null,
    );

    return user;
  }
}
