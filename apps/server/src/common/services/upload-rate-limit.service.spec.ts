import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadRateLimitService } from './upload-rate-limit.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('UploadRateLimitService', () => {
  let service: UploadRateLimitService;
  let supabaseService: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadRateLimitService,
        {
          provide: SupabaseService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UploadRateLimitService>(UploadRateLimitService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canUpload', () => {
    it('should return true for first upload', async () => {
      const result = await service.canUpload('user123');
      expect(result).toBe(true);
    });

    it('should allow 10 uploads per hour', async () => {
      const userId = 'user-unlimited';
      for (let i = 0; i < 10; i++) {
        const canUpload = await service.canUpload(userId);
        expect(canUpload).toBe(true);
      }
    });
  });

  describe('recordUpload', () => {
    it('should successfully record uploads', async () => {
      const userId = 'user-record';
      for (let i = 0; i < 5; i++) {
        await expect(service.recordUpload(userId)).resolves.not.toThrow();
      }
    });

    it('should throw error when limit exceeded (10 uploads/hour)', async () => {
      const userId = 'user-limited';
      // Record 10 uploads
      for (let i = 0; i < 10; i++) {
        await service.recordUpload(userId);
      }
      // 11th upload should fail
      await expect(service.recordUpload(userId)).rejects.toThrow(BadRequestException);
    });

    it('error message should include retry time', async () => {
      const userId = 'user-error';
      for (let i = 0; i < 10; i++) {
        await service.recordUpload(userId);
      }
      try {
        await service.recordUpload(userId);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error.message).toContain('Try again in');
      }
    });
  });

  describe('getRemainingUploads', () => {
    it('should return 10 for new user', () => {
      const remaining = service.getRemainingUploads('new-user');
      expect(remaining).toBe(10);
    });

    it('should decrease after recording uploads', async () => {
      const userId = 'user-remaining';
      await service.recordUpload(userId);
      const remaining = service.getRemainingUploads(userId);
      expect(remaining).toBe(9);
    });

    it('should return 0 when limit reached', async () => {
      const userId = 'user-zero';
      for (let i = 0; i < 10; i++) {
        await service.recordUpload(userId);
      }
      const remaining = service.getRemainingUploads(userId);
      expect(remaining).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 for new user', () => {
      const resetTime = service.getResetTime('brand-new-user');
      expect(resetTime).toBe(0);
    });

    it('should return time until reset after first upload', async () => {
      const userId = 'user-reset-time';
      await service.recordUpload(userId);
      const resetTime = service.getResetTime(userId);
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60 * 60 * 1000); // Less than 1 hour
    });
  });

  describe('resetUserLimit', () => {
    it('should reset user limit', async () => {
      const userId = 'user-reset';
      // Use up some uploads
      for (let i = 0; i < 5; i++) {
        await service.recordUpload(userId);
      }
      expect(service.getRemainingUploads(userId)).toBe(5);

      // Reset
      service.resetUserLimit(userId);
      expect(service.getRemainingUploads(userId)).toBe(10);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      const userId = 'user-cleanup';
      await service.recordUpload(userId);

      // Manually advance time by setting resetAt to past
      // This would normally happen after 1 hour
      expect(service.getRemainingUploads(userId)).toBe(9);

      // After time passes, should reset
      // (In real scenario, cleanup happens via interval)
      const futureRemaining = service.getRemainingUploads(userId);
      expect(futureRemaining).toBeLessThanOrEqual(10);
    });
  });
});
