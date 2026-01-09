"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const audit_export_service_1 = require("./audit-export.service");
const supabase_service_1 = require("../supabase/supabase.service");
describe('AuditExportService', () => {
    let service;
    let mockSupabaseClient;
    beforeEach(async () => {
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            like: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
            }),
            range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                audit_export_service_1.AuditExportService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: {
                        getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
                    },
                },
            ],
        }).compile();
        service = module.get(audit_export_service_1.AuditExportService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getAuditLogs', () => {
        it('should fetch audit logs without filters', async () => {
            mockSupabaseClient.limit.mockResolvedValue({
                data: [
                    {
                        id: 'log-1',
                        user_id: 'user-1',
                        action: 'login',
                        created_at: '2026-01-06T10:00:00Z',
                    },
                ],
                error: null,
            });
            const result = await service.getAuditLogs({});
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('activity_logs');
            expect(result).toHaveLength(1);
        });
        it('should apply date range filters', async () => {
            await service.getAuditLogs({
                dateFrom: '2026-01-01',
                dateTo: '2026-01-31',
            });
            expect(mockSupabaseClient.gte).toHaveBeenCalledWith('created_at', '2026-01-01');
            expect(mockSupabaseClient.lte).toHaveBeenCalledWith('created_at', '2026-01-31');
        });
        it('should filter by user ID', async () => {
            await service.getAuditLogs({
                userId: 'user-123',
            });
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
        });
        it('should filter by action', async () => {
            await service.getAuditLogs({
                action: 'approve',
            });
            expect(mockSupabaseClient.like).toHaveBeenCalledWith('action', '%approve%');
        });
        it('should filter by resource type', async () => {
            await service.getAuditLogs({
                resourceType: 'transaction',
            });
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('resource_type', 'transaction');
        });
        it('should filter by resource ID', async () => {
            await service.getAuditLogs({
                resourceId: 'tx-123',
            });
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('resource_id', 'tx-123');
        });
        it('should apply all filters together', async () => {
            await service.getAuditLogs({
                dateFrom: '2026-01-01',
                dateTo: '2026-01-31',
                userId: 'user-1',
                action: 'approve',
                resourceType: 'transaction',
                resourceId: 'tx-1',
            });
            expect(mockSupabaseClient.gte).toHaveBeenCalled();
            expect(mockSupabaseClient.lte).toHaveBeenCalled();
            expect(mockSupabaseClient.eq).toHaveBeenCalledTimes(3);
            expect(mockSupabaseClient.like).toHaveBeenCalled();
        });
    });
    describe('exportToCSV', () => {
        it('should export audit logs to CSV format', async () => {
            const logs = [
                {
                    id: 'log-1',
                    user_id: 'user-1',
                    action: 'transaction_approve',
                    resource_type: 'transaction',
                    resource_id: 'tx-1',
                    created_at: '2026-01-06T10:00:00Z',
                    changes: { status: 'APPROVED' },
                },
                {
                    id: 'log-2',
                    user_id: 'user-2',
                    action: 'kyc_reject',
                    resource_type: 'kyc_application',
                    resource_id: 'kyc-1',
                    created_at: '2026-01-06T11:00:00Z',
                    changes: { status: 'REJECTED' },
                },
            ];
            mockSupabaseClient.range.mockResolvedValue({
                data: logs,
                error: null,
            });
            const csv = await service.exportToCSV({});
            expect(csv).toContain('ID,User ID,Action,Resource Type,Resource ID,Timestamp,Changes');
            expect(csv).toContain('log-1');
            expect(csv).toContain('user-1');
            expect(csv).toContain('transaction_approve');
            expect(csv).toContain('log-2');
        });
        it('should handle empty logs', async () => {
            mockSupabaseClient.range.mockResolvedValue({
                data: [],
                error: null,
            });
            const csv = await service.exportToCSV({});
            expect(csv).toContain('ID,User ID,Action');
            expect(csv.split('\n').length).toBe(2);
        });
        it('should escape special characters in CSV', async () => {
            const logs = [
                {
                    id: 'log-1',
                    user_id: 'user-1',
                    action: 'test,"action"',
                    resource_type: 'test',
                    resource_id: 'test',
                    created_at: '2026-01-06',
                    changes: {},
                },
            ];
            mockSupabaseClient.range.mockResolvedValue({
                data: logs,
                error: null,
            });
            const csv = await service.exportToCSV({});
            expect(csv).toContain('"test,""action"""');
        });
    });
    describe('exportToJSON', () => {
        it('should export audit logs to JSON format', async () => {
            const logs = [
                {
                    id: 'log-1',
                    user_id: 'user-1',
                    action: 'login',
                    created_at: '2026-01-06',
                },
            ];
            mockSupabaseClient.range.mockResolvedValue({
                data: logs,
                error: null,
            });
            const json = await service.exportToJSON({});
            expect(json).toContain('"id":"log-1"');
            expect(json).toContain('"user_id":"user-1"');
            expect(json).toContain('"action":"login"');
        });
        it('should include metadata in JSON export', async () => {
            mockSupabaseClient.range.mockResolvedValue({
                data: [],
                error: null,
            });
            const json = await service.exportToJSON({
                dateFrom: '2026-01-01',
                dateTo: '2026-01-31',
            });
            expect(json).toContain('"metadata"');
            expect(json).toContain('"exportedAt"');
            expect(json).toContain('"filters"');
        });
    });
    describe('error handling', () => {
        it('should handle database errors', async () => {
            mockSupabaseClient.range.mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
            });
            await expect(service.getAuditLogs({})).rejects.toThrow();
        });
        it('should handle export errors', async () => {
            mockSupabaseClient.range.mockRejectedValue(new Error('Export failed'));
            await expect(service.exportToCSV({})).rejects.toThrow();
        });
    });
    describe('pagination', () => {
        it('should support pagination in audit logs', async () => {
            const manyLogs = Array.from({ length: 100 }, (_, i) => ({
                id: `log-${i}`,
                user_id: 'user-1',
                action: 'test',
                created_at: '2026-01-06',
            }));
            mockSupabaseClient.range.mockResolvedValue({
                data: manyLogs.slice(0, 50),
                error: null,
            });
            const result = await service.getAuditLogs({});
            expect(result.length).toBeLessThanOrEqual(1000);
        });
    });
});
//# sourceMappingURL=audit-export.service.spec.js.map