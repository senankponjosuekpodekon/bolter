import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ActivityLogService } from './activity-log.service';
import { RateLimitService } from './rate-limit.service';
import { SessionService } from './session.service';
import { BackupCodesService } from './backup-codes.service';
import { OtpService } from './otp.service';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    SupabaseModule,
    NotificationsModule,
    PassportModule,
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
    ActivityLogService,
    RateLimitService,
    SessionService,
    BackupCodesService,
    OtpService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, ActivityLogService, RateLimitService, SessionService, BackupCodesService, OtpService],
})
export class AuthModule { }