import { Module } from '@nestjs/common';
import { TontinesService } from './tontines.service';
import { TontinesController } from './tontines.controller';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [TontinesController],
  providers: [TontinesService, SupabaseService],
  exports: [TontinesService],
})
export class TontinesModule { }
