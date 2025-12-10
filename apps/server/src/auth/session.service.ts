import { Injectable } from '@nestjs/common';
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

@Injectable()
export class SessionService {
  private readonly DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly DEVICE_TRUST_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: Logger,
  ) { }

  async createSession(options: CreateSessionOptions): Promise<UserSession | null> {
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
      this.logger.error(`Failed to create session: ${error.message}`, undefined, SessionService.name);
      return null;
    }

    return data as UserSession;
  }

  async validateSession(
    sessionToken: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<{ valid: boolean; session: UserSession | null; reason?: string }> {
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

    const sessionData = session as UserSession;
    const now = new Date();
    const expiresAt = new Date(sessionData.expires_at);

    // Check if session expired
    if (now > expiresAt) {
      await this.revokeSession(sessionToken);
      return { valid: false, session: null, reason: 'Session expired' };
    }

    // Check IP address binding (unless device is trusted)
    if (!sessionData.is_trusted_device && sessionData.ip_address !== ipAddress) {
      this.logger.warn(
        `Session IP mismatch: expected ${sessionData.ip_address}, got ${ipAddress}`,
        SessionService.name,
      );
      await this.revokeSession(sessionToken);
      return { valid: false, session: null, reason: 'IP address mismatch' };
    }

    // Check if device trust expired
    if (sessionData.is_trusted_device && sessionData.trusted_until) {
      const trustedUntil = new Date(sessionData.trusted_until);
      if (now > trustedUntil) {
        // Trust expired - update session
        await this.untrustDevice(sessionToken);
        sessionData.is_trusted_device = false;
        sessionData.trusted_until = null;
      }
    }

    // Check user agent (soft check - log warning but don't revoke)
    if (userAgent && sessionData.user_agent && sessionData.user_agent !== userAgent) {
      this.logger.warn(
        `Session user-agent changed for user ${sessionData.user_id}`,
        SessionService.name,
      );
    }

    // Update last activity
    await this.updateLastActivity(sessionToken);

    return { valid: true, session: sessionData };
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('last_activity', { ascending: false });

    if (error) {
      this.logger.error(`Failed to get user sessions: ${error.message}`, undefined, SessionService.name);
      return [];
    }

    return (data as UserSession[]) || [];
  }

  async revokeSession(sessionToken: string): Promise<boolean> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('user_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_token', sessionToken);

    if (error) {
      this.logger.error(`Failed to revoke session: ${error.message}`, undefined, SessionService.name);
      return false;
    }

    return true;
  }

  async revokeAllUserSessions(userId: string, exceptToken?: string): Promise<number> {
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
      this.logger.error(`Failed to revoke user sessions: ${error.message}`, undefined, SessionService.name);
      return 0;
    }

    return count || 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const { error, count } = await this.supabase
      .getAdminClient()
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      this.logger.error(`Failed to cleanup expired sessions: ${error.message}`, undefined, SessionService.name);
      return 0;
    }

    return count || 0;
  }

  private async updateLastActivity(sessionToken: string): Promise<void> {
    await this.supabase
      .getAdminClient()
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken);
  }

  private async untrustDevice(sessionToken: string): Promise<void> {
    await this.supabase
      .getAdminClient()
      .from('user_sessions')
      .update({
        is_trusted_device: false,
        trusted_until: null,
      })
      .eq('session_token', sessionToken);
  }
}
