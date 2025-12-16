import { SupabaseService } from '../../supabase/supabase.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
export interface BucketStats {
    bucketName: string;
    totalSize: number;
    fileCount: number;
    quotaLimit: number;
    quotaUsagePercent: number;
    lastUpdated: Date;
}
export interface UserStorageStats {
    userId: string;
    totalSize: number;
    fileCount: number;
    lastUpdated: Date;
}
export declare class StorageMonitoringService {
    private supabase;
    private auditLogs;
    private readonly logger;
    private readonly BUCKET_QUOTAS;
    private readonly QUOTA_WARNING_THRESHOLD;
    private readonly QUOTA_CRITICAL_THRESHOLD;
    constructor(supabase: SupabaseService, auditLogs: AuditLogsService);
    getBucketStats(bucketName: string): Promise<BucketStats>;
    getUserStorageStats(userId: string): Promise<UserStorageStats>;
    checkBucketQuotas(): Promise<Array<{
        bucket: string;
        usagePercent: number;
        alert: string;
    }>>;
    logUploadAttempt(userId: string, bucketName: string, fileSize: number, success: boolean, error?: string): Promise<void>;
    getAllStorageMetrics(): Promise<{
        buckets: BucketStats[];
        totalStorageUsed: number;
        quotaAlerts: Array<{
            bucket: string;
            usagePercent: number;
            alert: string;
        }>;
        timestamp: Date;
    }>;
    private getUserBucketSize;
    private formatBytes;
    private getDefaultStats;
}
