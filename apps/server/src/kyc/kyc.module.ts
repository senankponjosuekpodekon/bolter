import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycStorageService } from './kyc-storage.service';
import { KycFilterService } from './kyc-filter.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadRateLimitService } from '../common/services/upload-rate-limit.service';
import { StorageMonitoringService } from '../common/services/storage-monitoring.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [SupabaseModule, NotificationsModule, AuditLogsModule],
  controllers: [KycController],
  providers: [KycService, KycStorageService, KycFilterService, UploadRateLimitService, StorageMonitoringService],
  exports: [KycService, KycStorageService, KycFilterService],
})
export class KycModule { }
