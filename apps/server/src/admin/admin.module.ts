import { Module } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { AuditExportService } from './audit-export.service';
import { AuditExportController } from './audit-export.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [BulkOperationsController, AuditExportController, AdminDashboardController],
  providers: [BulkOperationsService, AuditExportService, AdminService],
  exports: [BulkOperationsService, AuditExportService, AdminService],
})
export class AdminModule { }
