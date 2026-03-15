import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CardsModule } from './cards/cards.module';
import { TransactionsModule } from './transactions/transactions.module';
import { KycModule } from './kyc/kyc.module';
import { LoggerModule } from './common/logger/logger.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoansModule } from './loans/loans.module';
import { ExchangeModule } from './exchange/exchange.module';
import { AdminModule } from './admin/admin.module';
import { LocalizationModule } from './localization/localization.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { TontinesModule } from './tontines/tontines.module';
import { HealthController } from './health.controller';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    LoggerModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    CardsModule,
    TransactionsModule,
    KycModule,
    AuditLogsModule,
    NotificationsModule,
    WebhooksModule,
    LoansModule,
    ExchangeModule,
    AdminModule,
    LocalizationModule,
    TontinesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [HealthController],
})
export class AppModule { }
