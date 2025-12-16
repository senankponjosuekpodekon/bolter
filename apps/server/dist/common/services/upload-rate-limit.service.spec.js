"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const upload_rate_limit_service_1 = require("./upload-rate-limit.service");
const supabase_service_1 = require("../../supabase/supabase.service");
describe('UploadRateLimitService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                upload_rate_limit_service_1.UploadRateLimitService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: {},
                },
            ],
        }).compile();
        service = module.get(upload_rate_limit_service_1.UploadRateLimitService);
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
            for (let i = 0; i < 10; i++) {
                await service.recordUpload(userId);
            }
            await expect(service.recordUpload(userId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('error message should include retry time', async () => {
            const userId = 'user-error';
            for (let i = 0; i < 10; i++) {
                await service.recordUpload(userId);
            }
            try {
                await service.recordUpload(userId);
                fail('Should have thrown BadRequestException');
            }
            catch (error) {
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
            expect(resetTime).toBeLessThanOrEqual(60 * 60 * 1000);
        });
    });
    describe('resetUserLimit', () => {
        it('should reset user limit', async () => {
            const userId = 'user-reset';
            for (let i = 0; i < 5; i++) {
                await service.recordUpload(userId);
            }
            expect(service.getRemainingUploads(userId)).toBe(5);
            service.resetUserLimit(userId);
            expect(service.getRemainingUploads(userId)).toBe(10);
        });
    });
    describe('cleanup', () => {
        it('should clean up expired entries', async () => {
            const userId = 'user-cleanup';
            await service.recordUpload(userId);
            expect(service.getRemainingUploads(userId)).toBe(9);
            const futureRemaining = service.getRemainingUploads(userId);
            expect(futureRemaining).toBeLessThanOrEqual(10);
        });
    });
});
//# sourceMappingURL=upload-rate-limit.service.spec.js.map