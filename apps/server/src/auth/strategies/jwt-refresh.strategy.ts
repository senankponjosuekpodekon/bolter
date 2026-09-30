import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from '../auth.constants';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // httpOnly cookie is the primary transport for browsers
        (req: Request) => req?.cookies?.[REFRESH_TOKEN_COOKIE] ?? null,
        // Bearer header kept for non-browser clients (mobile, curl, Swagger)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string; tfa_verified?: boolean }) {
    const refreshToken =
      req.cookies?.[REFRESH_TOKEN_COOKIE] ??
      (req.get('Authorization') ?? '').replace('Bearer', '').trim();
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tfa_verified: payload.tfa_verified,
      refreshToken,
    };
  }
}