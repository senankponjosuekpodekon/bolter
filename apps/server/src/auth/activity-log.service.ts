import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ActivityLogService {
    constructor(private supabase: SupabaseService) { }

    async logActivity(entry: ActivityLogEntry): Promise<void> {
        try {
            await this.supabase.getAdminClient().from('activity_logs').insert({
                user_id: entry.userId,
                action: entry.action,
                resource_id: entry.resourceId,
                resource_type: entry.resourceType,
                changes: entry.changes,
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                created_at: new Date().toISOString(),
            });
        } catch (error) {
            // Log errors but don't throw - activity logging should not block operations
            console.error('Failed to log activity:', error);
        }
    }

    async getActivityLogs(userId?: string, limit: number = 100) {
        try {
            let query = this.supabase.getAdminClient().from('activity_logs').select('*');

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
            return [];
        }
    }
}
