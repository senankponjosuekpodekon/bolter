"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const audit_logs_service_1 = require("../../audit-logs/audit-logs.service");
let StorageMonitoringService = StorageMonitoringService_1 = class StorageMonitoringService {
    constructor(supabase, auditLogs) {
        this.supabase = supabase;
        this.auditLogs = auditLogs;
        this.logger = new common_1.Logger(StorageMonitoringService_1.name);
        this.BUCKET_QUOTAS = {
            'profile-avatars': 1024 * 1024 * 1024,
            'kyc-documents': 10 * 1024 * 1024 * 1024,
        };
        this.QUOTA_WARNING_THRESHOLD = 0.8;
        this.QUOTA_CRITICAL_THRESHOLD = 0.95;
    }
    async getBucketStats(bucketName) {
        try {
            const client = this.supabase.getAdminClient();
            const { error } = await client.storage.from(bucketName).list('', {
                limit: 10000,
            });
            if (error) {
                this.logger.warn(`Failed to fetch bucket stats for ${bucketName}: ${error.message}`);
                return this.getDefaultStats(bucketName);
            }
            let totalSize = 0;
            let fileCount = 0;
            const calculateSize = async (path) => {
                try {
                    const { data: items } = await client.storage.from(bucketName).list(path);
                    if (items) {
                        for (const item of items) {
                            const fullPath = path ? `${path}/${item.name}` : item.name;
                            if (item.id) {
                                totalSize += item.metadata?.size || 0;
                                fileCount++;
                            }
                            else {
                                await calculateSize(fullPath);
                            }
                        }
                    }
                }
                catch (err) {
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
        }
        catch (error) {
            this.logger.error(`Failed to get bucket stats for ${bucketName}:`, error);
            return this.getDefaultStats(bucketName);
        }
    }
    async getUserStorageStats(userId) {
        try {
            let totalSize = 0;
            let fileCount = 0;
            const avatarStats = await this.getUserBucketSize(userId, 'profile-avatars');
            totalSize += avatarStats.size;
            fileCount += avatarStats.count;
            const kycStats = await this.getUserBucketSize(userId, 'kyc-documents');
            totalSize += kycStats.size;
            fileCount += kycStats.count;
            return {
                userId,
                totalSize,
                fileCount,
                lastUpdated: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to get user storage stats for ${userId}:`, error);
            return {
                userId,
                totalSize: 0,
                fileCount: 0,
                lastUpdated: new Date(),
            };
        }
    }
    async checkBucketQuotas() {
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
                }
                else if (stats.quotaUsagePercent >= this.QUOTA_WARNING_THRESHOLD) {
                    const alert = {
                        bucket: bucketName,
                        usagePercent: stats.quotaUsagePercent,
                        alert: `WARNING: Bucket ${bucketName} usage at ${stats.quotaUsagePercent.toFixed(1)}% (${this.formatBytes(stats.totalSize)}/${this.formatBytes(stats.quotaLimit)})`,
                    };
                    alerts.push(alert);
                    this.logger.warn(alert.alert);
                }
            }
            catch (error) {
                this.logger.error(`Error checking quota for ${bucketName}:`, error);
            }
        }
        return alerts;
    }
    async logUploadAttempt(userId, bucketName, fileSize, success, error) {
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
        }
        catch (logError) {
            this.logger.warn(`Failed to log upload attempt: ${logError}`);
        }
    }
    async getAllStorageMetrics() {
        const buckets = [];
        for (const bucketName of Object.keys(this.BUCKET_QUOTAS)) {
            try {
                const stats = await this.getBucketStats(bucketName);
                buckets.push(stats);
            }
            catch (error) {
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
    async getUserBucketSize(userId, bucketName) {
        try {
            const client = this.supabase.getAdminClient();
            const { data: files, error } = await client.storage.from(bucketName).list(`${userId}`);
            if (error || !files) {
                return { size: 0, count: 0 };
            }
            let totalSize = 0;
            let fileCount = 0;
            const calculateSize = async (path) => {
                try {
                    const { data: items } = await client.storage.from(bucketName).list(path);
                    if (items) {
                        for (const item of items) {
                            if (item.id) {
                                totalSize += item.metadata?.size || 0;
                                fileCount++;
                            }
                            else {
                                const fullPath = path ? `${path}/${item.name}` : item.name;
                                await calculateSize(fullPath);
                            }
                        }
                    }
                }
                catch (err) {
                    this.logger.debug(`Error calculating user size for ${path}:`, err);
                }
            };
            await calculateSize(`${userId}`);
            return { size: totalSize, count: fileCount };
        }
        catch (error) {
            this.logger.warn(`Failed to get user bucket size for ${userId}/${bucketName}:`, error);
            return { size: 0, count: 0 };
        }
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    getDefaultStats(bucketName) {
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
};
exports.StorageMonitoringService = StorageMonitoringService;
exports.StorageMonitoringService = StorageMonitoringService = StorageMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService])
], StorageMonitoringService);
//# sourceMappingURL=storage-monitoring.service.js.map