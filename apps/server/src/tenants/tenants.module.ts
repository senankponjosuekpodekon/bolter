import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, SupabaseService, AuditLogsService],
  exports: [TenantsService],
})
export class TenantsModule {}
