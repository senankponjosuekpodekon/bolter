import { Module } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { AuditExportService } from './audit-export.service';
import { AuditExportController } from './audit-export.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { StorageMonitoringService } from '../common/services/storage-monitoring.service';
import { StorageMonitoringController } from './storage-monitoring.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [SupabaseModule, AuthModule, AuditLogsModule],
  controllers: [BulkOperationsController, AuditExportController, AdminDashboardController, StorageMonitoringController],
  providers: [BulkOperationsService, AuditExportService, AdminService, StorageMonitoringService],
  exports: [BulkOperationsService, AuditExportService, AdminService, StorageMonitoringService],
})
export class AdminModule { }
