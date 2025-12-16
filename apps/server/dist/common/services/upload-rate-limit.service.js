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
var UploadRateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadRateLimitService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let UploadRateLimitService = UploadRateLimitService_1 = class UploadRateLimitService {
    constructor(supabase) {
        this.supabase = supabase;
        this.logger = new common_1.Logger(UploadRateLimitService_1.name);
        this.MAX_UPLOADS_PER_HOUR = 10;
        this.HOUR_MS = 60 * 60 * 1000;
        this.rateLimits = new Map();
        setInterval(() => this.cleanupExpiredEntries(), this.HOUR_MS);
    }
    async canUpload(userId) {
        const limit = this.rateLimits.get(userId);
        const now = new Date();
        if (!limit || now > limit.resetAt) {
            const resetAt = new Date(now.getTime() + this.HOUR_MS);
            this.rateLimits.set(userId, { userId, uploadCount: 0, resetAt });
            return true;
        }
        return limit.uploadCount < this.MAX_UPLOADS_PER_HOUR;
    }
    async recordUpload(userId) {
        const limit = this.rateLimits.get(userId);
        const now = new Date();
        if (!limit || now > limit.resetAt) {
            const resetAt = new Date(now.getTime() + this.HOUR_MS);
            this.rateLimits.set(userId, { userId, uploadCount: 1, resetAt });
            return;
        }
        if (limit.uploadCount >= this.MAX_UPLOADS_PER_HOUR) {
            const remainingMinutes = Math.ceil((limit.resetAt.getTime() - now.getTime()) / 60000);
            throw new common_1.BadRequestException(`Upload rate limit exceeded. Maximum ${this.MAX_UPLOADS_PER_HOUR} uploads per hour. Try again in ${remainingMinutes} minutes.`);
        }
        limit.uploadCount++;
    }
    getRemainingUploads(userId) {
        const limit = this.rateLimits.get(userId);
        const now = new Date();
        if (!limit || now > limit.resetAt) {
            return this.MAX_UPLOADS_PER_HOUR;
        }
        return Math.max(0, this.MAX_UPLOADS_PER_HOUR - limit.uploadCount);
    }
    getResetTime(userId) {
        const limit = this.rateLimits.get(userId);
        const now = new Date();
        if (!limit || now > limit.resetAt) {
            return 0;
        }
        return Math.max(0, limit.resetAt.getTime() - now.getTime());
    }
    resetUserLimit(userId) {
        this.rateLimits.delete(userId);
        this.logger.log(`Reset upload rate limit for user ${userId}`);
    }
    cleanupExpiredEntries() {
        const now = new Date();
        let cleaned = 0;
        for (const [userId, limit] of this.rateLimits.entries()) {
            if (now > limit.resetAt) {
                this.rateLimits.delete(userId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
        }
    }
};
exports.UploadRateLimitService = UploadRateLimitService;
exports.UploadRateLimitService = UploadRateLimitService = UploadRateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UploadRateLimitService);
//# sourceMappingURL=upload-rate-limit.service.js.map