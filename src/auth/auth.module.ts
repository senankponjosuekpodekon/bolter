import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { SessionsService } from './sessions.service';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 3600000, // 1 hour
        limit: 100, // 100 requests per hour (default for non-2FA endpoints)
      },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: `${config.get<number>('jwt.expiresIn')}s`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    SessionsService,
    TokenBlacklistService,
  ],
  exports: [AuthService],
})
export class AuthModule { }