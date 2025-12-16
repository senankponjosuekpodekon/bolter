import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

interface UploadRateLimit {
  userId: string;
  uploadCount: number;
  resetAt: Date;
}

/**
 * UploadRateLimitService tracks per-user file upload counts
 * Enforces limit of 10 uploads per hour per user
 */
@Injectable()
export class UploadRateLimitService {
  private readonly logger = new Logger(UploadRateLimitService.name);
  private readonly MAX_UPLOADS_PER_HOUR = 10;
  private readonly HOUR_MS = 60 * 60 * 1000;

  // In-memory cache for rate limits (can be extended to Redis for distributed systems)
  private rateLimits = new Map<string, UploadRateLimit>();

  constructor(private supabase: SupabaseService) {
    // Clean up expired entries every hour
    setInterval(() => this.cleanupExpiredEntries(), this.HOUR_MS);
  }

  /**
   * Check if user can upload (rate limit not exceeded)
   * @param userId User ID
   * @returns true if user can upload, false otherwise
   */
  async canUpload(userId: string): Promise<boolean> {
    const limit = this.rateLimits.get(userId);
    const now = new Date();

    // No entry yet or reset time has passed
    if (!limit || now > limit.resetAt) {
      // Create new entry
      const resetAt = new Date(now.getTime() + this.HOUR_MS);
      this.rateLimits.set(userId, { userId, uploadCount: 0, resetAt });
      return true;
    }

    // Check if limit exceeded
    return limit.uploadCount < this.MAX_UPLOADS_PER_HOUR;
  }

  /**
   * Record an upload for a user
   * @param userId User ID
   * @throws BadRequestException if rate limit exceeded
   */
  async recordUpload(userId: string): Promise<void> {
    const limit = this.rateLimits.get(userId);
    const now = new Date();

    if (!limit || now > limit.resetAt) {
      // Initialize new entry
      const resetAt = new Date(now.getTime() + this.HOUR_MS);
      this.rateLimits.set(userId, { userId, uploadCount: 1, resetAt });
      return;
    }

    // Increment counter
    if (limit.uploadCount >= this.MAX_UPLOADS_PER_HOUR) {
      const remainingMinutes = Math.ceil((limit.resetAt.getTime() - now.getTime()) / 60000);
      throw new BadRequestException(
        `Upload rate limit exceeded. Maximum ${this.MAX_UPLOADS_PER_HOUR} uploads per hour. Try again in ${remainingMinutes} minutes.`,
      );
    }

    limit.uploadCount++;
  }

  /**
   * Get remaining uploads for user in current hour
   * @param userId User ID
   * @returns Number of remaining uploads
   */
  getRemainingUploads(userId: string): number {
    const limit = this.rateLimits.get(userId);
    const now = new Date();

    if (!limit || now > limit.resetAt) {
      return this.MAX_UPLOADS_PER_HOUR;
    }

    return Math.max(0, this.MAX_UPLOADS_PER_HOUR - limit.uploadCount);
  }

  /**
   * Get time until rate limit resets for user
   * @param userId User ID
   * @returns Time in milliseconds until reset
   */
  getResetTime(userId: string): number {
    const limit = this.rateLimits.get(userId);
    const now = new Date();

    if (!limit || now > limit.resetAt) {
      return 0;
    }

    return Math.max(0, limit.resetAt.getTime() - now.getTime());
  }

  /**
   * Reset rate limit for a user (admin only)
   * @param userId User ID
   */
  resetUserLimit(userId: string): void {
    this.rateLimits.delete(userId);
    this.logger.log(`Reset upload rate limit for user ${userId}`);
  }

  /**
   * Clean up expired entries from memory
   * @private
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [userId, limit] of this.rateLimits.entries()) {
      if (now > limit.resetAt) {
        this.rateLimits.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }
}
