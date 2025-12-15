import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UploadRateLimitService } from '../common/services/upload-rate-limit.service';

@Module({
  imports: [
    AuditLogsModule,
    ThrottlerModule.forRoot([
      {
        name: 'avatar',
        ttl: 60_000,
        limit: 50,
      },
    ]),
  ],
  controllers: [AvatarController],
  providers: [
    AvatarService,
    SupabaseService,
    UploadRateLimitService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AvatarService],
})
export class AvatarModule {}
