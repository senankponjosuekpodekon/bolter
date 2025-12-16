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
var RateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const logger_service_1 = require("../common/logger/logger.service");
let RateLimitService = RateLimitService_1 = class RateLimitService {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
        this.configs = {
            '2fa_verify': { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
            'login': { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
            'password_reset': { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
        };
    }
    async checkRateLimit(userId, actionType, ipAddress) {
        const config = this.configs[actionType];
        if (!config) {
            return { allowed: true, remainingAttempts: -1, resetAt: null };
        }
        const now = new Date();
        const windowStart = new Date(now.getTime() - config.windowMs);
        const entry = await this.getRateLimitEntry(userId, actionType, ipAddress);
        if (!entry) {
            await this.createRateLimitEntry(userId, actionType, ipAddress);
            return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetAt: new Date(now.getTime() + config.windowMs) };
        }
        if (entry.blocked_until) {
            const blockedUntil = new Date(entry.blocked_until);
            if (now < blockedUntil) {
                this.logger.warn(`Rate limit block active for user ${userId}, action ${actionType} until ${blockedUntil.toISOString()}`, RateLimitService_1.name);
                return { allowed: false, remainingAttempts: 0, resetAt: blockedUntil };
            }
            await this.resetRateLimitEntry(userId, actionType, ipAddress);
            return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetAt: new Date(now.getTime() + config.windowMs) };
        }
        const entryWindowStart = new Date(entry.window_start);
        if (entryWindowStart < windowStart) {
            await this.resetRateLimitEntry(userId, actionType, ipAddress);
            return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetAt: new Date(now.getTime() + config.windowMs) };
        }
        if (entry.attempts >= config.maxAttempts) {
            const blockedUntil = new Date(entryWindowStart.getTime() + config.windowMs);
            await this.blockUser(userId, actionType, ipAddress, blockedUntil);
            this.logger.warn(`Rate limit exceeded for user ${userId}, action ${actionType}. Blocked until ${blockedUntil.toISOString()}`, RateLimitService_1.name);
            return { allowed: false, remainingAttempts: 0, resetAt: blockedUntil };
        }
        await this.incrementAttempts(userId, actionType, ipAddress);
        const remainingAttempts = config.maxAttempts - (entry.attempts + 1);
        const resetAt = new Date(entryWindowStart.getTime() + config.windowMs);
        return { allowed: true, remainingAttempts, resetAt };
    }
    async recordAttempt(userId, actionType, ipAddress) {
        await this.incrementAttempts(userId, actionType, ipAddress);
    }
    async resetRateLimit(userId, actionType, ipAddress) {
        await this.resetRateLimitEntry(userId, actionType, ipAddress);
    }
    async getRateLimitEntry(userId, actionType, ipAddress) {
        const query = this.supabase
            .getAdminClient()
            .from('rate_limits')
            .select('*')
            .eq('user_id', userId)
            .eq('action_type', actionType);
        if (ipAddress) {
            query.eq('ip_address', ipAddress);
        }
        else {
            query.is('ip_address', null);
        }
        const { data, error } = await query.maybeSingle();
        if (error) {
            this.logger.error(`Failed to get rate limit entry: ${error.message}`, undefined, RateLimitService_1.name);
            return null;
        }
        return data;
    }
    async createRateLimitEntry(userId, actionType, ipAddress) {
        const { error } = await this.supabase.getAdminClient().from('rate_limits').insert({
            user_id: userId,
            action_type: actionType,
            ip_address: ipAddress || null,
            attempts: 1,
            window_start: new Date().toISOString(),
            last_attempt: new Date().toISOString(),
        });
        if (error) {
            this.logger.error(`Failed to create rate limit entry: ${error.message}`, undefined, RateLimitService_1.name);
        }
    }
    async incrementAttempts(userId, actionType, ipAddress) {
        const query = this.supabase
            .getAdminClient()
            .from('rate_limits')
            .update({
            attempts: this.supabase.getAdminClient().rpc('increment_attempts', {}),
            last_attempt: new Date().toISOString(),
        })
            .eq('user_id', userId)
            .eq('action_type', actionType);
        if (ipAddress) {
            query.eq('ip_address', ipAddress);
        }
        else {
            query.is('ip_address', null);
        }
        const { error } = await query;
        if (error) {
            const entry = await this.getRateLimitEntry(userId, actionType, ipAddress);
            if (entry) {
                const updateQuery = this.supabase
                    .getAdminClient()
                    .from('rate_limits')
                    .update({
                    attempts: entry.attempts + 1,
                    last_attempt: new Date().toISOString(),
                })
                    .eq('user_id', userId)
                    .eq('action_type', actionType);
                if (ipAddress) {
                    updateQuery.eq('ip_address', ipAddress);
                }
                else {
                    updateQuery.is('ip_address', null);
                }
                await updateQuery;
            }
        }
    }
    async blockUser(userId, actionType, ipAddress, until) {
        const query = this.supabase
            .getAdminClient()
            .from('rate_limits')
            .update({
            blocked_until: until.toISOString(),
        })
            .eq('user_id', userId)
            .eq('action_type', actionType);
        if (ipAddress) {
            query.eq('ip_address', ipAddress);
        }
        else {
            query.is('ip_address', null);
        }
        const { error } = await query;
        if (error) {
            this.logger.error(`Failed to block user: ${error.message}`, undefined, RateLimitService_1.name);
        }
    }
    async resetRateLimitEntry(userId, actionType, ipAddress) {
        const query = this.supabase
            .getAdminClient()
            .from('rate_limits')
            .update({
            attempts: 1,
            window_start: new Date().toISOString(),
            last_attempt: new Date().toISOString(),
            blocked_until: null,
        })
            .eq('user_id', userId)
            .eq('action_type', actionType);
        if (ipAddress) {
            query.eq('ip_address', ipAddress);
        }
        else {
            query.is('ip_address', null);
        }
        const { error } = await query;
        if (error) {
            this.logger.error(`Failed to reset rate limit entry: ${error.message}`, undefined, RateLimitService_1.name);
        }
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = RateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        logger_service_1.Logger])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map