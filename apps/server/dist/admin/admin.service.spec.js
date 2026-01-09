"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const admin_service_1 = require("./admin.service");
const supabase_service_1 = require("../supabase/supabase.service");
describe('AdminService', () => {
    let service;
    let mockSupabaseClient;
    beforeEach(async () => {
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                admin_service_1.AdminService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: {
                        getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
                    },
                },
            ],
        }).compile();
        service = module.get(admin_service_1.AdminService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getDashboardMetrics', () => {
        it('should be callable', () => {
            expect(service.getDashboardMetrics).toBeDefined();
            expect(typeof service.getDashboardMetrics).toBe('function');
        });
        it('should handle errors gracefully', async () => {
            mockSupabaseClient.from.mockImplementation(() => ({
                select: jest.fn().mockResolvedValue({
                    data: null,
                    count: 0,
                    error: { message: 'Database error' },
                }),
            }));
            await expect(service.getDashboardMetrics()).rejects.toThrow();
        });
    });
    describe('getTransactionStats', () => {
        it('should be callable', () => {
            expect(service.getTransactionStats).toBeDefined();
            expect(typeof service.getTransactionStats).toBe('function');
        });
    });
    describe('getUserStats', () => {
        it('should be callable', () => {
            expect(service.getUserStats).toBeDefined();
            expect(typeof service.getUserStats).toBe('function');
        });
    });
    describe('getKycStats', () => {
        it('should be callable', () => {
            expect(service.getKycStats).toBeDefined();
            expect(typeof service.getKycStats).toBe('function');
        });
    });
    describe('getTimeSeriesData', () => {
        it('should be callable', () => {
            expect(service.getTimeSeriesData).toBeDefined();
            expect(typeof service.getTimeSeriesData).toBe('function');
        });
    });
    describe('caching', () => {
        it('should have caching mechanism', () => {
            expect(service).toHaveProperty('metricsCache');
        });
    });
});
//# sourceMappingURL=admin.service.spec.js.map