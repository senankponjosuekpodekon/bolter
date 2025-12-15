import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { UsersModule } from '../users/users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DataCleanupService } from '../common/services/data-cleanup.service';

@Module({
  imports: [UsersModule, AuditLogsModule, NotificationsModule],
  controllers: [AccountsController],
  providers: [AccountsService, DataCleanupService],
  exports: [AccountsService],
})
export class AccountsModule { }
