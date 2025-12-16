import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

export interface BucketStats {
  bucketName: string;
  totalSize: number; // in bytes
  fileCount: number;
  quotaLimit: number; // in bytes
  quotaUsagePercent: number;
  lastUpdated: Date;
}

export interface UserStorageStats {
  userId: string;
  totalSize: number;
  fileCount: number;
  lastUpdated: Date;
}

/**
 * StorageMonitoringService tracks storage usage and generates alerts
 * Monitors:
 * - Per-bucket usage (profile-avatars, kyc-documents)
 * - Per-user storage usage
 * - Quota warnings (>80%)
 * - Upload failures
 */
@Injectable()
export class StorageMonitoringService {
  private readonly logger = new Logger(StorageMonitoringService.name);

  // Storage quotas (in bytes)
  private readonly BUCKET_QUOTAS = {
    'profile-avatars': 1024 * 1024 * 1024, // 1 GB
    'kyc-documents': 10 * 1024 * 1024 * 1024, // 10 GB
  };

  // Thresholds for alerts
  private readonly QUOTA_WARNING_THRESHOLD = 0.8; // 80%
  private readonly QUOTA_CRITICAL_THRESHOLD = 0.95; // 95%

  constructor(
    private supabase: SupabaseService,
    private auditLogs: AuditLogsService,
  ) { }

  /**
   * Get statistics for a specific bucket
   * @param bucketName Name of the bucket
   * @returns Bucket statistics
   */
  async getBucketStats(bucketName: string): Promise<BucketStats> {
    try {
      const client = this.supabase.getAdminClient();
      const { error } = await client.storage.from(bucketName).list('', {
        limit: 10000,
      });

      if (error) {
        this.logger.warn(`Failed to fetch bucket stats for ${bucketName}: ${error.message}`);
        return this.getDefaultStats(bucketName);
      }

      // Calculate total size recursively
      let totalSize = 0;
      let fileCount = 0;

      const calculateSize = async (path: string) => {
        try {
          const { data: items } = await client.storage.from(bucketName).list(path);
          if (items) {
            for (const item of items) {
              const fullPath = path ? `${path}/${item.name}` : item.name;
              if (item.id) {
                // File
                totalSize += item.metadata?.size || 0;
                fileCount++;
              } else {
                // Directory - recurse
                await calculateSize(fullPath);
              }
            }
          }
        } catch (err) {
          this.logger.debug(`Error calculating size for path ${path}: ${err}`);
        }
      };

      await calculateSize('');

      const quotaLimit = this.BUCKET_QUOTAS[bucketName] || 10 * 1024 * 1024 * 1024;
      const usagePercent = (totalSize / quotaLimit) * 100;

      return {
        bucketName,
        totalSize,
        fileCount,
        quotaLimit,
        quotaUsagePercent: usagePercent,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get bucket stats for ${bucketName}:`, error);
      return this.getDefaultStats(bucketName);
    }
  }

  /**
   * Get storage stats for a specific user
   * @param userId User ID
   * @returns User storage statistics
   */
  async getUserStorageStats(userId: string): Promise<UserStorageStats> {
    try {
      let totalSize = 0;
      let fileCount = 0;

      // Check avatars
      const avatarStats = await this.getUserBucketSize(userId, 'profile-avatars');
      totalSize += avatarStats.size;
      fileCount += avatarStats.count;

      // Check KYC documents
      const kycStats = await this.getUserBucketSize(userId, 'kyc-documents');
      totalSize += kycStats.size;
      fileCount += kycStats.count;

      return {
        userId,
        totalSize,
        fileCount,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get user storage stats for ${userId}:`, error);
      return {
        userId,
        totalSize: 0,
        fileCount: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Check bucket quotas and generate alerts if needed
   * @returns Alert details if threshold exceeded
   */
  async checkBucketQuotas(): Promise<Array<{ bucket: string; usagePercent: number; alert: string }>> {
    const alerts = [];

    for (const bucketName of Object.keys(this.BUCKET_QUOTAS)) {
      try {
        const stats = await this.getBucketStats(bucketName);

        if (stats.quotaUsagePercent >= this.QUOTA_CRITICAL_THRESHOLD) {
          const alert = {
            bucket: bucketName,
            usagePercent: stats.quotaUsagePercent,
            alert: `CRITICAL: Bucket ${bucketName} usage at ${stats.quotaUsagePercent.toFixed(1)}% (${this.formatBytes(stats.totalSize)}/${this.formatBytes(stats.quotaLimit)})`,
          };
          alerts.push(alert);
          this.logger.error(alert.alert);
        } else if (stats.quotaUsagePercent >= this.QUOTA_WARNING_THRESHOLD) {
          const alert = {
            bucket: bucketName,
            usagePercent: stats.quotaUsagePercent,
            alert: `WARNING: Bucket ${bucketName} usage at ${stats.quotaUsagePercent.toFixed(1)}% (${this.formatBytes(stats.totalSize)}/${this.formatBytes(stats.quotaLimit)})`,
          };
          alerts.push(alert);
          this.logger.warn(alert.alert);
        }
      } catch (error) {
        this.logger.error(`Error checking quota for ${bucketName}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Log an upload attempt for monitoring
   * @param userId User ID
   * @param bucketName Bucket name
   * @param fileSize File size in bytes
   * @param success Whether upload succeeded
   * @param error Error message if failed
   */
  async logUploadAttempt(
    userId: string,
    bucketName: string,
    fileSize: number,
    success: boolean,
    error?: string,
  ): Promise<void> {
    try {
      await this.auditLogs.log({
        userId,
        performedBy: userId,
        action: success ? 'UPLOAD_SUCCESS' : 'UPLOAD_FAILED',
        resourceType: 'file',
        resourceId: bucketName,
        metadata: {
          bucketName,
          fileSize,
          formattedSize: this.formatBytes(fileSize),
          error: error || null,
        },
      });
    } catch (logError) {
      this.logger.warn(`Failed to log upload attempt: ${logError}`);
    }
  }

  /**
   * Get all storage metrics (dashboard view)
   * @returns Aggregated storage metrics
   */
  async getAllStorageMetrics(): Promise<{
    buckets: BucketStats[];
    totalStorageUsed: number;
    quotaAlerts: Array<{ bucket: string; usagePercent: number; alert: string }>;
    timestamp: Date;
  }> {
    const buckets: BucketStats[] = [];

    for (const bucketName of Object.keys(this.BUCKET_QUOTAS)) {
      try {
        const stats = await this.getBucketStats(bucketName);
        buckets.push(stats);
      } catch (error) {
        this.logger.error(`Failed to get stats for bucket ${bucketName}:`, error);
      }
    }

    const totalStorageUsed = buckets.reduce((sum, b) => sum + b.totalSize, 0);
    const quotaAlerts = await this.checkBucketQuotas();

    return {
      buckets,
      totalStorageUsed,
      quotaAlerts,
      timestamp: new Date(),
    };
  }

  /**
   * Get size of user's files in a bucket
   * @private
   */
  private async getUserBucketSize(
    userId: string,
    bucketName: string,
  ): Promise<{ size: number; count: number }> {
    try {
      const client = this.supabase.getAdminClient();
      const { data: files, error } = await client.storage.from(bucketName).list(`${userId}`);

      if (error || !files) {
        return { size: 0, count: 0 };
      }

      let totalSize = 0;
      let fileCount = 0;

      // Recursively calculate size
      const calculateSize = async (path: string) => {
        try {
          const { data: items } = await client.storage.from(bucketName).list(path);
          if (items) {
            for (const item of items) {
              if (item.id) {
                totalSize += item.metadata?.size || 0;
                fileCount++;
              } else {
                const fullPath = path ? `${path}/${item.name}` : item.name;
                await calculateSize(fullPath);
              }
            }
          }
        } catch (err) {
          this.logger.debug(`Error calculating user size for ${path}:`, err);
        }
      };

      await calculateSize(`${userId}`);

      return { size: totalSize, count: fileCount };
    } catch (error) {
      this.logger.warn(`Failed to get user bucket size for ${userId}/${bucketName}:`, error);
      return { size: 0, count: 0 };
    }
  }

  /**
   * Format bytes to human-readable format
   * @private
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get default stats structure
   * @private
   */
  private getDefaultStats(bucketName: string): BucketStats {
    const quotaLimit = this.BUCKET_QUOTAS[bucketName] || 10 * 1024 * 1024 * 1024;
    return {
      bucketName,
      totalSize: 0,
      fileCount: 0,
      quotaLimit,
      quotaUsagePercent: 0,
      lastUpdated: new Date(),
    };
  }
}
