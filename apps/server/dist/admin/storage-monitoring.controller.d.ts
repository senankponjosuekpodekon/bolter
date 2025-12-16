import { StorageMonitoringService, BucketStats, UserStorageStats } from '../common/services/storage-monitoring.service';
export declare class StorageMonitoringController {
    private readonly storageMonitoring;
    constructor(storageMonitoring: StorageMonitoringService);
    getMetrics(): Promise<Record<string, unknown>>;
    getBucketStats(bucketName: string): Promise<BucketStats>;
    getUserStorage(userId: string): Promise<UserStorageStats>;
    checkQuotas(): Promise<Array<{
        bucket: string;
        usagePercent: number;
        alert: string;
    }>>;
}
