import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';
export interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
}
export interface RateLimitEntry {
    id: string;
    user_id: string;
    action_type: string;
    ip_address: string | null;
    attempts: number;
    window_start: string;
    last_attempt: string;
    blocked_until: string | null;
}
export declare class RateLimitService {
    private readonly supabase;
    private readonly logger;
    private readonly configs;
    constructor(supabase: SupabaseService, logger: Logger);
    checkRateLimit(userId: string, actionType: string, ipAddress?: string): Promise<{
        allowed: boolean;
        remainingAttempts: number;
        resetAt: Date | null;
    }>;
    recordAttempt(userId: string, actionType: string, ipAddress?: string): Promise<void>;
    resetRateLimit(userId: string, actionType: string, ipAddress?: string): Promise<void>;
    private getRateLimitEntry;
    private createRateLimitEntry;
    private incrementAttempts;
    private blockUser;
    private resetRateLimitEntry;
}
