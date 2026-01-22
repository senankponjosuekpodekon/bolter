import { Module } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { AuditExportService } from './audit-export.service';
import { AuditExportController } from './audit-export.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminFilterController } from './admin-filter.controller';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { StorageMonitoringService } from '../common/services/storage-monitoring.service';
import { StorageMonitoringController } from './storage-monitoring.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { KycModule } from '../kyc/kyc.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [SupabaseModule, AuthModule, AuditLogsModule, KycModule, TransactionsModule],
  controllers: [BulkOperationsController, AuditExportController, AdminDashboardController, StorageMonitoringController, AdminFilterController, AnalyticsController],
  providers: [BulkOperationsService, AuditExportService, AdminService, StorageMonitoringService, AnalyticsService],
  exports: [BulkOperationsService, AuditExportService, AdminService, StorageMonitoringService, AnalyticsService],
})
export class AdminModule { }
