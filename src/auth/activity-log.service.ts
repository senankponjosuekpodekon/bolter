import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../apps/server/src/supabase/supabase.service';

export type ActivityType = 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE' | '2FA_ENABLE' | '2FA_DISABLE';

@Injectable()
export class ActivityLogService {
  constructor(private supabase: SupabaseService) {}

  async log(userId: string, type: ActivityType, details?: string): Promise<void> {
    await this.supabase.getAdminClient().from('activity_log').insert({
      user_id: userId,
      type,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  async getUserActivity(userId: string, limit = 20): Promise<any[]> {
    const { data, error } = await this.supabase.getAdminClient()
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data;
  }
}
