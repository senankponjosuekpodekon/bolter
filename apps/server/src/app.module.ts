import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MaintenanceMiddleware } from './common/middleware/maintenance.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { HealthModule } from './health/health.module';
import { SystemConfigModule } from './system-config/system-config.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: (config.get<number>('throttle.ttl') || 60) * 1000,
            limit: config.get<number>('throttle.limit') || 300,
          },
        ],
      }),
    }),
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
    HealthModule,
    SystemConfigModule,
    TenantsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
    consumer.apply(MaintenanceMiddleware).forRoutes('*');
  }
}
