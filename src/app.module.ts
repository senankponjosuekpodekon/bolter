import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from '../apps/server/src/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from '../apps/server/src/accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { KycModule } from './kyc/kyc.module';
import { LoggerModule } from './common/logger/logger.module';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationsModule } from './notifications/notifications.module';
import configuration from '../apps/server/src/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    LoggerModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    KycModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: 'APP_INTERCEPTOR',
      useClass: RateLimitInterceptor,
    },
    NotificationsGateway,
  ],
})
export class AppModule { }
