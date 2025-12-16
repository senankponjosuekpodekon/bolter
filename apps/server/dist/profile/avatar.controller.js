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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const platform_express_1 = require("@nestjs/platform-express");
const avatar_service_1 = require("./avatar.service");
const jwt_verified_guard_1 = require("../auth/guards/jwt-verified.guard");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const upload_rate_limit_service_1 = require("../common/services/upload-rate-limit.service");
const storage_monitoring_service_1 = require("../common/services/storage-monitoring.service");
let AvatarController = class AvatarController {
    constructor(avatarService, auditLogs, uploadRateLimit, storageMonitoring) {
        this.avatarService = avatarService;
        this.auditLogs = auditLogs;
        this.uploadRateLimit = uploadRateLimit;
        this.storageMonitoring = storageMonitoring;
    }
    async upload(req, file) {
        const userId = req.user?.id || req.user?.sub;
        await this.uploadRateLimit.recordUpload(userId);
        try {
            const result = await this.avatarService.upload(userId, file);
            await this.auditLogs.log({
                action: 'avatar.upload',
                resourceType: 'avatar',
                resourceId: userId,
                userId,
                metadata: {
                    path: result.path,
                    fileSize: file.size,
                    remainingUploads: this.uploadRateLimit.getRemainingUploads(userId),
                },
                context: {
                    ip: req.ip,
                    userAgent: req.headers?.['user-agent'] ?? null,
                    requestId: req.id ?? null,
                },
            });
            await this.storageMonitoring.logUploadAttempt(userId, 'profile-avatars', file.size, true);
            return {
                ...result,
                remaining: this.uploadRateLimit.getRemainingUploads(userId),
            };
        }
        catch (error) {
            await this.storageMonitoring.logUploadAttempt(userId, 'profile-avatars', file.size || 0, false, error.message);
            throw error;
        }
    }
    async get(req) {
        const userId = req.user?.id || req.user?.sub;
        return { url: await this.avatarService.get(userId) };
    }
    async remove(req) {
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
};
exports.AvatarController = AvatarController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_verified_guard_1.JwtVerifiedGuard),
    (0, throttler_1.Throttle)({ avatar: { limit: 5, ttl: 60_000 } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_verified_guard_1.JwtVerifiedGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "get", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.UseGuards)(jwt_verified_guard_1.JwtVerifiedGuard),
    (0, throttler_1.Throttle)({ avatar: { limit: 5, ttl: 60_000 } }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "remove", null);
exports.AvatarController = AvatarController = __decorate([
    (0, common_1.Controller)('profile/avatar'),
    __metadata("design:paramtypes", [avatar_service_1.AvatarService,
        audit_logs_service_1.AuditLogsService,
        upload_rate_limit_service_1.UploadRateLimitService,
        storage_monitoring_service_1.StorageMonitoringService])
], AvatarController);
//# sourceMappingURL=avatar.controller.js.map