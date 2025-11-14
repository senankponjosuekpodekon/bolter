import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any, done: Function) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(payload);
    if (token && await this.tokenBlacklistService.isTokenBlacklisted(token)) {
      return done(null, false);
    }
    const user = await this.usersService.findById(payload.sub);
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      ...user,
    };
  }
}