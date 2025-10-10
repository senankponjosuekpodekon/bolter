import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { LedgerModule } from './ledger/ledger.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { BankIntegrationsModule } from './bank-integrations/bank-integrations.module';
import { EmailModule } from './email/email.module';
import { LoggerModule } from './common/logger/logger.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('THROTTLE_TTL', 60),
        limit: config.get<number>('THROTTLE_LIMIT', 10),
      }),
    }),
    
    // Scheduling for recurring tasks
    ScheduleModule.forRoot(),
    
    // Core modules
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    LedgerModule,
    NotificationsModule,
    SubscriptionsModule,
    BankIntegrationsModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}