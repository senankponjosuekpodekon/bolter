"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const analytics_service_1 = require("./analytics.service");
const supabase_service_1 = require("../supabase/supabase.service");
const createMockClient = (tableData) => ({
    from: (table) => {
        const rows = tableData[table] ?? [];
        const builder = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolver) => resolver({ data: rows, error: null }),
        };
        return builder;
    },
});
describe('AnalyticsService', () => {
    let service;
    let supabaseService;
    beforeEach(async () => {
        supabaseService = {
            getClient: jest.fn(() => createMockClient({})),
            getAdminClient: jest.fn(() => createMockClient({})),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [analytics_service_1.AnalyticsService, { provide: supabase_service_1.SupabaseService, useValue: supabaseService }],
        }).compile();
        service = module.get(analytics_service_1.AnalyticsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should throw error when required params are missing', async () => {
        await expect(service.generateReport({})).rejects.toThrow();
    });
    it('should throw error when startDate is after endDate', async () => {
        const query = {
            type: 'transactions',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-01-01'),
            tenantId: 'tenant-1',
        };
        await expect(service.generateReport(query)).rejects.toThrow();
    });
    it('should generate transaction report', async () => {
        const query = {
            type: 'transactions',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            tenantId: 'tenant-1',
        };
        supabaseService.getAdminClient.mockReturnValue(createMockClient({
            transactions: [
                { id: '1', amount: 1000, status: 'approved', created_at: '2024-01-15', tenant_id: 'tenant-1' },
            ],
        }));
        const report = await service.generateReport(query);
        expect(report.type).toBe('transactions');
        expect(report.data.length).toBeGreaterThan(0);
    });
    it('should generate user report', async () => {
        const query = {
            type: 'users',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            tenantId: 'tenant-1',
        };
        supabaseService.getAdminClient.mockReturnValue(createMockClient({
            users: [
                { id: '1', status: 'active', created_at: '2024-01-15', tenant_id: 'tenant-1' },
                { id: '2', status: 'active', created_at: '2024-01-20', tenant_id: 'tenant-1' },
            ],
        }));
        const report = await service.generateReport(query);
        expect(report.type).toBe('users');
        expect(report.summary.totalRecords).toBe(2);
    });
    it('should export CSV and JSON', () => {
        const report = {
            id: 'rpt_123',
            name: 'Test Report',
            type: 'transactions',
            generatedAt: new Date(),
            data: [
                { timestamp: new Date('2024-01-15'), segment: 'approved', value: 1000 },
                { timestamp: new Date('2024-01-20'), segment: 'pending', value: 2000 },
            ],
            summary: {
                totalRecords: 2,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                segments: 2,
            },
        };
        const csv = service.exportToCSV(report);
        const json = service.exportToJSON(report);
        expect(csv).toContain('timestamp');
        expect(JSON.parse(json).type).toBe('transactions');
    });
    it('should generate time series data', async () => {
        const query = {
            type: 'transactions',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            tenantId: 'tenant-1',
        };
        supabaseService.getClient.mockReturnValue(createMockClient({
            transactions: [
                { id: '1', amount: 1000, status: 'approved', created_at: '2024-01-15', tenant_id: 'tenant-1' },
                { id: '2', amount: 2000, status: 'approved', created_at: '2024-01-15', tenant_id: 'tenant-1' },
            ],
        }));
        const timeSeries = await service.getTimeSeriesData(query, 'daily');
        expect(Array.isArray(timeSeries)).toBe(true);
    });
    describe('clearCache', () => {
        it('should clear all cache', async () => {
            const query = {
                type: 'transactions',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                tenantId: 'tenant-1',
            };
            const report = await service.generateReport(query);
            service['cacheMap'].set('transactions', { data: report, expiresAt: Date.now() + 1000 });
            service.clearCache();
            expect(service['cacheMap'].size).toBe(0);
        });
        it('should clear cache by type', async () => {
            const query = {
                type: 'transactions',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                tenantId: 'tenant-1',
            };
            const report = await service.generateReport(query);
            service['cacheMap'].set('transactions', { data: report, expiresAt: Date.now() + 1000 });
            service.clearCache('transactions');
            expect(service['cacheMap'].has('transactions')).toBe(false);
        });
    });
    describe('Error handling', () => {
        it('should throw error on invalid report type', async () => {
            const query = {
                type: 'invalid',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                tenantId: 'tenant-1',
            };
            await expect(service.generateReport(query)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=analytics.service.spec.js.map