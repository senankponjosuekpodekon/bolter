import { SupabaseService } from '../../supabase/supabase.service';
export declare class UploadRateLimitService {
    private supabase;
    private readonly logger;
    private readonly MAX_UPLOADS_PER_HOUR;
    private readonly HOUR_MS;
    private rateLimits;
    constructor(supabase: SupabaseService);
    canUpload(userId: string): Promise<boolean>;
    recordUpload(userId: string): Promise<void>;
    getRemainingUploads(userId: string): number;
    getResetTime(userId: string): number;
    resetUserLimit(userId: string): void;
    private cleanupExpiredEntries;
}
