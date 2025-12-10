import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
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

@Injectable()
export class RateLimitService {
  private readonly configs: Record<string, RateLimitConfig> = {
    '2fa_verify': { maxAttempts: 5, windowMs: 60 * 60 * 1000 }, // 5 attempts per hour
    'login': { maxAttempts: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
    'password_reset': { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  };

  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: Logger,
  ) { }

  async checkRateLimit(
    userId: string,
    actionType: string,
    ipAddress?: string,
  ): Promise<{ allowed: boolean; remainingAttempts: number; resetAt: Date | null }> {
    const config = this.configs[actionType];
    if (!config) {
      // No rate limit configured for this action
      return { allowed: true, remainingAttempts: -1, resetAt: null };
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Get or create rate limit entry
    const entry = await this.getRateLimitEntry(userId, actionType, ipAddress);

    if (!entry) {
      // First attempt - create entry
      await this.createRateLimitEntry(userId, actionType, ipAddress);
      return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetAt: new Date(now.getTime() + config.windowMs) };
    }

    // Check if blocked
    if (entry.blocked_until) {
      const blockedUntil = new Date(entry.blocked_until);
      if (now < blockedUntil) {
        this.logger.warn(
          `Rate limit block active for user ${userId}, action ${actionType} until ${blockedUntil.toISOString()}`,
          RateLimitService.name,
        );
        return { allowed: false, remainingAttempts: 0, resetAt: blockedUntil };
      }
      // Block expired - reset entry
      await this.resetRateLimitEntry(userId, actionType, ipAddress);
      return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetAt: new Date(now.getTime() + config.windowMs) };
    }

    const entryWindowStart = new Date(entry.window_start);

    // Check if window has expired
    if (entryWindowStart < windowStart) {
      // Window expired - reset
      await this.resetRateLimitEntry(userId, actionType, ipAddress);
      return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetAt: new Date(now.getTime() + config.windowMs) };
    }

    // Within window - check attempts
    if (entry.attempts >= config.maxAttempts) {
      // Exceeded limit - block user
      const blockedUntil = new Date(entryWindowStart.getTime() + config.windowMs);
      await this.blockUser(userId, actionType, ipAddress, blockedUntil);
      this.logger.warn(
        `Rate limit exceeded for user ${userId}, action ${actionType}. Blocked until ${blockedUntil.toISOString()}`,
        RateLimitService.name,
      );
      return { allowed: false, remainingAttempts: 0, resetAt: blockedUntil };
    }

    // Increment attempts
    await this.incrementAttempts(userId, actionType, ipAddress);
    const remainingAttempts = config.maxAttempts - (entry.attempts + 1);
    const resetAt = new Date(entryWindowStart.getTime() + config.windowMs);

    return { allowed: true, remainingAttempts, resetAt };
  }

  async recordAttempt(userId: string, actionType: string, ipAddress?: string): Promise<void> {
    await this.incrementAttempts(userId, actionType, ipAddress);
  }

  async resetRateLimit(userId: string, actionType: string, ipAddress?: string): Promise<void> {
    await this.resetRateLimitEntry(userId, actionType, ipAddress);
  }

  private async getRateLimitEntry(
    userId: string,
    actionType: string,
    ipAddress?: string,
  ): Promise<RateLimitEntry | null> {
    const query = this.supabase
      .getAdminClient()
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', actionType);

    if (ipAddress) {
      query.eq('ip_address', ipAddress);
    } else {
      query.is('ip_address', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      this.logger.error(`Failed to get rate limit entry: ${error.message}`, undefined, RateLimitService.name);
      return null;
    }

    return data as RateLimitEntry | null;
  }

  private async createRateLimitEntry(userId: string, actionType: string, ipAddress?: string): Promise<void> {
    const { error } = await this.supabase.getAdminClient().from('rate_limits').insert({
      user_id: userId,
      action_type: actionType,
      ip_address: ipAddress || null,
      attempts: 1,
      window_start: new Date().toISOString(),
      last_attempt: new Date().toISOString(),
    });

    if (error) {
      this.logger.error(`Failed to create rate limit entry: ${error.message}`, undefined, RateLimitService.name);
    }
  }

  private async incrementAttempts(userId: string, actionType: string, ipAddress?: string): Promise<void> {
    const query = this.supabase
      .getAdminClient()
      .from('rate_limits')
      .update({
        attempts: this.supabase.getAdminClient().rpc('increment_attempts', {}),
        last_attempt: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('action_type', actionType);

    if (ipAddress) {
      query.eq('ip_address', ipAddress);
    } else {
      query.is('ip_address', null);
    }

    const { error } = await query;

    if (error) {
      // Fallback: manual increment
      const entry = await this.getRateLimitEntry(userId, actionType, ipAddress);
      if (entry) {
        const updateQuery = this.supabase
          .getAdminClient()
          .from('rate_limits')
          .update({
            attempts: entry.attempts + 1,
            last_attempt: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('action_type', actionType);

        if (ipAddress) {
          updateQuery.eq('ip_address', ipAddress);
        } else {
          updateQuery.is('ip_address', null);
        }

        await updateQuery;
      }
    }
  }

  private async blockUser(userId: string, actionType: string, ipAddress: string | undefined, until: Date): Promise<void> {
    const query = this.supabase
      .getAdminClient()
      .from('rate_limits')
      .update({
        blocked_until: until.toISOString(),
      })
      .eq('user_id', userId)
      .eq('action_type', actionType);

    if (ipAddress) {
      query.eq('ip_address', ipAddress);
    } else {
      query.is('ip_address', null);
    }

    const { error } = await query;

    if (error) {
      this.logger.error(`Failed to block user: ${error.message}`, undefined, RateLimitService.name);
    }
  }

  private async resetRateLimitEntry(userId: string, actionType: string, ipAddress?: string): Promise<void> {
    const query = this.supabase
      .getAdminClient()
      .from('rate_limits')
      .update({
        attempts: 1,
        window_start: new Date().toISOString(),
        last_attempt: new Date().toISOString(),
        blocked_until: null,
      })
      .eq('user_id', userId)
      .eq('action_type', actionType);

    if (ipAddress) {
      query.eq('ip_address', ipAddress);
    } else {
      query.is('ip_address', null);
    }

    const { error } = await query;

    if (error) {
      this.logger.error(`Failed to reset rate limit entry: ${error.message}`, undefined, RateLimitService.name);
    }
  }
}
