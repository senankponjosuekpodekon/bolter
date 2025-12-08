import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';
export interface UserSession {
    id: string;
    user_id: string;
    session_token: string;
    refresh_token: string | null;
    ip_address: string;
    user_agent: string | null;
    device_fingerprint: string | null;
    is_trusted_device: boolean;
    trusted_until: string | null;
    last_activity: string;
    created_at: string;
    expires_at: string;
    revoked_at: string | null;
}
export interface CreateSessionOptions {
    userId: string;
    sessionToken: string;
    refreshToken?: string;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    trustDevice?: boolean;
    expiresInMs?: number;
}
export declare class SessionService {
    private readonly supabase;
    private readonly logger;
    private readonly DEFAULT_SESSION_DURATION_MS;
    private readonly DEVICE_TRUST_DURATION_MS;
    constructor(supabase: SupabaseService, logger: Logger);
    createSession(options: CreateSessionOptions): Promise<UserSession | null>;
    validateSession(sessionToken: string, ipAddress: string, userAgent?: string): Promise<{
        valid: boolean;
        session: UserSession | null;
        reason?: string;
    }>;
    getUserSessions(userId: string): Promise<UserSession[]>;
    revokeSession(sessionToken: string): Promise<boolean>;
    revokeAllUserSessions(userId: string, exceptToken?: string): Promise<number>;
    cleanupExpiredSessions(): Promise<number>;
    private updateLastActivity;
    private untrustDevice;
}
