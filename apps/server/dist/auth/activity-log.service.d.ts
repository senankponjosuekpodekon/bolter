import { SupabaseService } from '../supabase/supabase.service';
export interface ActivityLogEntry {
    userId: string;
    action: string;
    resourceId?: string;
    resourceType?: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class ActivityLogService {
    private supabase;
    constructor(supabase: SupabaseService);
    logActivity(entry: ActivityLogEntry): Promise<void>;
    getActivityLogs(userId?: string, limit?: number): Promise<any[]>;
}
