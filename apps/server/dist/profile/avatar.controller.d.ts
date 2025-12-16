import { AvatarService } from './avatar.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UploadRateLimitService } from '../common/services/upload-rate-limit.service';
import { StorageMonitoringService } from '../common/services/storage-monitoring.service';
import { Request } from 'express';
type AuthRequest = Request & {
    user?: {
        id?: string;
        sub?: string;
    };
    id?: string;
};
type UploadedImageFile = {
    mimetype: string;
    size: number;
    buffer: Buffer;
};
export declare class AvatarController {
    private readonly avatarService;
    private readonly auditLogs;
    private readonly uploadRateLimit;
    private readonly storageMonitoring;
    constructor(avatarService: AvatarService, auditLogs: AuditLogsService, uploadRateLimit: UploadRateLimitService, storageMonitoring: StorageMonitoringService);
    upload(req: AuthRequest, file: UploadedImageFile): Promise<{
        remaining: number;
        url: string;
        path: string;
    }>;
    get(req: AuthRequest): Promise<{
        url: string;
    }>;
    remove(req: AuthRequest): Promise<{
        success: boolean;
    }>;
}
export {};
