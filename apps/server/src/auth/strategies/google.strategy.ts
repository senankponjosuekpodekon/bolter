import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: { tenant?: { id?: string } },
    _accessToken: string,
    _refreshToken: string,
    profile: { emails?: Array<{ value: string }>; id: string; displayName?: string },
    done: VerifyCallback,
  ): Promise<void> {
    const tenantId = req.tenant?.id ?? null;
    const user = await this.authService.validateOAuthUser(profile, tenantId);
    done(null, user);
  }
}