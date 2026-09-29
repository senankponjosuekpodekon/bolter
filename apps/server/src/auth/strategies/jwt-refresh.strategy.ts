import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string; tfa_verified?: boolean }) {
    const refreshToken = (req.get('Authorization') ?? '').replace('Bearer', '').trim();
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tfa_verified: payload.tfa_verified,
      refreshToken,
    };
  }
}