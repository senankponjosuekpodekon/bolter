import { Controller, Post, Get, Delete, UseInterceptors, UploadedFile, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarService } from './avatar.service';
import { JwtVerifiedGuard } from '../auth/guards/jwt-verified.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('profile/avatar')
export class AvatarController {
  constructor(
    private readonly avatarService: AvatarService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  @Post()
  @UseGuards(JwtVerifiedGuard)
  @Throttle({ avatar: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Req() req: any, @UploadedFile() file: any) {
    const userId = req.user?.id || req.user?.sub;
    const result = await this.avatarService.upload(userId, file);
    await this.auditLogs.log({
      action: 'avatar.upload',
      resourceType: 'avatar',
      resourceId: userId,
      userId,
      metadata: { path: result.path },
      context: {
        ip: req.ip,
        userAgent: req.headers?.['user-agent'] ?? null,
        requestId: req.id ?? null,
      },
    });
    return result;
  }

  @Get()
  @UseGuards(JwtVerifiedGuard)
  async get(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return { url: await this.avatarService.get(userId) };
  }

  @Delete()
  @UseGuards(JwtVerifiedGuard)
  @Throttle({ avatar: { limit: 5, ttl: 60_000 } })
  async remove(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    await this.avatarService.delete(userId);
    await this.auditLogs.log({
      action: 'avatar.delete',
      resourceType: 'avatar',
      resourceId: userId,
      userId,
      context: {
        ip: req.ip,
        userAgent: req.headers?.['user-agent'] ?? null,
        requestId: req.id ?? null,
      },
    });
    return { success: true };
  }
}
