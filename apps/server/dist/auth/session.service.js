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
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const logger_service_1 = require("../common/logger/logger.service");
let SessionService = SessionService_1 = class SessionService {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
        this.DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
        this.DEVICE_TRUST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
    }
    async createSession(options) {
        const expiresAt = new Date(Date.now() + (options.expiresInMs || this.DEFAULT_SESSION_DURATION_MS));
        const trustedUntil = options.trustDevice
            ? new Date(Date.now() + this.DEVICE_TRUST_DURATION_MS)
            : null;
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('user_sessions')
            .insert({
            user_id: options.userId,
            session_token: options.sessionToken,
            refresh_token: options.refreshToken || null,
            ip_address: options.ipAddress,
            user_agent: options.userAgent || null,
            device_fingerprint: options.deviceFingerprint || null,
            is_trusted_device: options.trustDevice || false,
            trusted_until: trustedUntil?.toISOString() || null,
            expires_at: expiresAt.toISOString(),
        })
            .select()
            .single();
        if (error) {
            this.logger.error(`Failed to create session: ${error.message}`, undefined, SessionService_1.name);
            return null;
        }
        return data;
    }
    async validateSession(sessionToken, ipAddress, userAgent) {
        const { data: session, error } = await this.supabase
            .getAdminClient()
            .from('user_sessions')
            .select('*')
            .eq('session_token', sessionToken)
            .is('revoked_at', null)
            .maybeSingle();
        if (error || !session) {
            return { valid: false, session: null, reason: 'Session not found' };
        }
        const sessionData = session;
        const now = new Date();
        const expiresAt = new Date(sessionData.expires_at);
        if (now > expiresAt) {
            await this.revokeSession(sessionToken);
            return { valid: false, session: null, reason: 'Session expired' };
        }
        if (!sessionData.is_trusted_device && sessionData.ip_address !== ipAddress) {
            this.logger.warn(`Session IP mismatch: expected ${sessionData.ip_address}, got ${ipAddress}`, SessionService_1.name);
            await this.revokeSession(sessionToken);
            return { valid: false, session: null, reason: 'IP address mismatch' };
        }
        if (sessionData.is_trusted_device && sessionData.trusted_until) {
            const trustedUntil = new Date(sessionData.trusted_until);
            if (now > trustedUntil) {
                await this.untrustDevice(sessionToken);
                sessionData.is_trusted_device = false;
                sessionData.trusted_until = null;
            }
        }
        if (userAgent && sessionData.user_agent && sessionData.user_agent !== userAgent) {
            this.logger.warn(`Session user-agent changed for user ${sessionData.user_id}`, SessionService_1.name);
        }
        await this.updateLastActivity(sessionToken);
        return { valid: true, session: sessionData };
    }
    async getUserSessions(userId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .is('revoked_at', null)
            .order('last_activity', { ascending: false });
        if (error) {
            this.logger.error(`Failed to get user sessions: ${error.message}`, undefined, SessionService_1.name);
            return [];
        }
        return data || [];
    }
    async revokeSession(sessionToken) {
        const { error } = await this.supabase
            .getAdminClient()
            .from('user_sessions')
            .update({ revoked_at: new Date().toISOString() })
            .eq('session_token', sessionToken);
        if (error) {
            this.logger.error(`Failed to revoke session: ${error.message}`, undefined, SessionService_1.name);
            return false;
        }
        return true;
    }
    async revokeAllUserSessions(userId, exceptToken) {
        const query = this.supabase
            .getAdminClient()
            .from('user_sessions')
            .update({ revoked_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('revoked_at', null);
        if (exceptToken) {
            query.neq('session_token', exceptToken);
        }
        const { error, count } = await query;
        if (error) {
            this.logger.error(`Failed to revoke user sessions: ${error.message}`, undefined, SessionService_1.name);
            return 0;
        }
        return count || 0;
    }
    async cleanupExpiredSessions() {
        const { error, count } = await this.supabase
            .getAdminClient()
            .from('user_sessions')
            .delete()
            .lt('expires_at', new Date().toISOString());
        if (error) {
            this.logger.error(`Failed to cleanup expired sessions: ${error.message}`, undefined, SessionService_1.name);
            return 0;
        }
        return count || 0;
    }
    async updateLastActivity(sessionToken) {
        await this.supabase
            .getAdminClient()
            .from('user_sessions')
            .update({ last_activity: new Date().toISOString() })
            .eq('session_token', sessionToken);
    }
    async untrustDevice(sessionToken) {
        await this.supabase
            .getAdminClient()
            .from('user_sessions')
            .update({
            is_trusted_device: false,
            trusted_until: null,
        })
            .eq('session_token', sessionToken);
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        logger_service_1.Logger])
], SessionService);
//# sourceMappingURL=session.service.js.map