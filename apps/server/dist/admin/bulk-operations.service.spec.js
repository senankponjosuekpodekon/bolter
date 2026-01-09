"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const bulk_operations_service_1 = require("./bulk-operations.service");
const supabase_service_1 = require("../supabase/supabase.service");
const activity_log_service_1 = require("../auth/activity-log.service");
describe('BulkOperationsService', () => {
    let service;
    let mockSupabaseClient;
    let activityLogService;
    beforeEach(async () => {
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                bulk_operations_service_1.BulkOperationsService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: {
                        getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
                    },
                },
                {
                    provide: activity_log_service_1.ActivityLogService,
                    useValue: {
                        logActivity: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(bulk_operations_service_1.BulkOperationsService);
        activityLogService = module.get(activity_log_service_1.ActivityLogService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('bulkReviewKYCDocuments', () => {
        it('should throw error if no IDs provided', async () => {
            await expect(service.bulkReviewKYCDocuments('user-1', {
                ids: [],
                action: 'approve',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw error for invalid action', async () => {
            await expect(service.bulkReviewKYCDocuments('user-1', {
                ids: ['doc-1'],
                action: 'invalid',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should approve multiple KYC documents successfully', async () => {
            mockSupabaseClient.from.mockImplementation((table) => {
                if (table === 'kyc_documents') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({
                                    data: { id: 'doc-1', status: 'PENDING' },
                                    error: null,
                                }),
                            }),
                        }),
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ error: null }),
                        }),
                    };
                }
                return mockSupabaseClient;
            });
            const result = await service.bulkReviewKYCDocuments('user-1', {
                ids: ['doc-1', 'doc-2'],
                action: 'approve',
                reason: 'Verified',
            });
            expect(result.success).toBe(2);
            expect(result.failed).toBe(0);
            expect(activityLogService.logActivity).toHaveBeenCalledTimes(2);
        });
        it('should handle missing documents', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    }),
                }),
            }));
            const result = await service.bulkReviewKYCDocuments('user-1', {
                ids: ['doc-missing'],
                action: 'approve',
            });
            expect(result.success).toBe(0);
            expect(result.failed).toBe(1);
            expect(result.details[0]).toContain('Not found');
        });
        it('should handle database errors gracefully', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'doc-1', status: 'PENDING' },
                            error: null,
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: { message: 'Update failed' },
                    }),
                }),
            }));
            const result = await service.bulkReviewKYCDocuments('user-1', {
                ids: ['doc-1'],
                action: 'approve',
            });
            expect(result.failed).toBe(1);
            expect(result.details[0]).toContain('Update failed');
        });
        it('should reject multiple KYC documents', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'doc-1', status: 'PENDING' },
                            error: null,
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            }));
            const result = await service.bulkReviewKYCDocuments('user-1', {
                ids: ['doc-1'],
                action: 'reject',
                reason: 'Incomplete documents',
            });
            expect(result.success).toBe(1);
            expect(result.details[0]).toContain('REJECTED');
        });
    });
    describe('bulkReviewTransactions', () => {
        it('should throw error if no IDs provided', async () => {
            await expect(service.bulkReviewTransactions('user-1', {
                ids: [],
                action: 'approve',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should approve multiple transactions successfully', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'tx-1', status: 'PENDING' },
                            error: null,
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            }));
            const result = await service.bulkReviewTransactions('user-1', {
                ids: ['tx-1', 'tx-2'],
                action: 'approve',
            });
            expect(result.success).toBe(2);
            expect(result.failed).toBe(0);
        });
        it('should not modify non-pending transactions', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'tx-1', status: 'APPROVED' },
                            error: null,
                        }),
                    }),
                }),
            }));
            const result = await service.bulkReviewTransactions('user-1', {
                ids: ['tx-1'],
                action: 'approve',
            });
            expect(result.failed).toBe(1);
            expect(result.details[0]).toContain('Cannot modify non-pending');
        });
        it('should handle missing transactions', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    }),
                }),
            }));
            const result = await service.bulkReviewTransactions('user-1', {
                ids: ['tx-missing'],
                action: 'approve',
            });
            expect(result.failed).toBe(1);
            expect(result.details[0]).toContain('Not found');
        });
        it('should reject multiple transactions', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'tx-1', status: 'PENDING' },
                            error: null,
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            }));
            const result = await service.bulkReviewTransactions('user-1', {
                ids: ['tx-1'],
                action: 'reject',
                reason: 'Suspicious activity',
            });
            expect(result.success).toBe(1);
            expect(result.details[0]).toContain('REJECTED');
        });
    });
});
//# sourceMappingURL=bulk-operations.service.spec.js.map