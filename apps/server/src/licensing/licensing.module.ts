import { Module } from '@nestjs/common';
import { LicensingService } from './licensing.service';
import { LicensingController } from './licensing.controller';
import { SupabaseService } from '../database/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Module({
  controllers: [LicensingController],
  providers: [LicensingService, SupabaseService, AuditLogsService],
  exports: [LicensingService],
})
export class LicensingModule {}
