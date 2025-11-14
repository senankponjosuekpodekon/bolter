import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../apps/server/src/supabase/supabase.service';

@Injectable()
export class TokenBlacklistService {
    constructor(private supabase: SupabaseService) { }

    async blacklistToken(token: string, expiresAt: Date): Promise<void> {
        await this.supabase.getAdminClient().from('token_blacklist').insert({
            token,
            expires_at: expiresAt.toISOString(),
            blacklisted_at: new Date().toISOString(),
        });
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        const { data, error } = await this.supabase.getAdminClient()
            .from('token_blacklist')
            .select('token')
            .eq('token', token)
            .maybeSingle();
        if (error) return false;
        return !!data;
    }

    async cleanupExpiredTokens(): Promise<void> {
        await this.supabase.getAdminClient()
            .from('token_blacklist')
            .delete()
            .lt('expires_at', new Date().toISOString());
    }
}
