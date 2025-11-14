import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../apps/server/src/supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';

export interface Session {
    id: string;
    userId: string;
    refreshToken: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    expiresAt: Date;
    isActive: boolean;
}

@Injectable()
export class SessionsService {
    constructor(private supabase: SupabaseService, private readonly logger: Logger) { }

    async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
        const session = {
            ...sessionData,
            id: this.generateSessionId(),
            createdAt: new Date(),
        };

        const { data, error } = await this.supabase.getAdminClient()
            .from('user_sessions')
            .insert({
                id: session.id,
                user_id: session.userId,
                refresh_token: session.refreshToken,
                device_info: session.deviceInfo,
                ip_address: session.ipAddress,
                user_agent: session.userAgent,
                expires_at: session.expiresAt,
                is_active: session.isActive,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create session: ${error.message}`);

        this.logger.log(`Session created for user: ${session.userId} (sessionId: ${session.id})`, 'SessionsService');

        return this.mapSession(data);
    }

    async getUserSessions(userId: string): Promise<Session[]> {
        const { data, error } = await this.supabase.getAdminClient()
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to get sessions: ${error.message}`);

        return data.map(s => this.mapSession(s));
    }

    async invalidateSession(sessionId: string): Promise<void> {
        const { error } = await this.supabase.getAdminClient()
            .from('user_sessions')
            .update({ is_active: false })
            .eq('id', sessionId);

        if (error) throw new Error(`Failed to invalidate session: ${error.message}`);

        this.logger.log(`Session revoked: ${sessionId}`, 'SessionsService');
    }

    async invalidateAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
        let query = this.supabase.getAdminClient()
            .from('user_sessions')
            .update({ is_active: false })
            .eq('user_id', userId)
            .eq('is_active', true);

        if (exceptSessionId) {
            query = query.neq('id', exceptSessionId);
        }

        const { error } = await query;

        if (error) throw new Error(`Failed to invalidate sessions: ${error.message}`);

        this.logger.log(`All sessions revoked for user: ${userId} except session: ${exceptSessionId || 'none'}`, 'SessionsService');
    }

    async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
        const { data, error } = await this.supabase.getAdminClient()
            .from('user_sessions')
            .select('*')
            .eq('refresh_token', refreshToken)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw new Error(`Failed to find session: ${error.message}`);

        return data ? this.mapSession(data) : null;
    }

    async cleanupExpiredSessions(): Promise<void> {
        const { error } = await this.supabase.getAdminClient()
            .from('user_sessions')
            .update({ is_active: false })
            .lt('expires_at', new Date());

        if (error) throw new Error(`Failed to cleanup sessions: ${error.message}`);
    }

    private generateSessionId(): string {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private mapSession(data: any): Session {
        return {
            id: data.id,
            userId: data.user_id,
            refreshToken: data.refresh_token,
            deviceInfo: data.device_info,
            ipAddress: data.ip_address,
            userAgent: data.user_agent,
            createdAt: new Date(data.created_at),
            expiresAt: new Date(data.expires_at),
            isActive: data.is_active,
        };
    }
}