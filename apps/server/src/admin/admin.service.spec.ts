import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('AdminService', () => {
  let service: AdminService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  const mockSupabaseService = {
    getAdminClient: jest.fn(() => mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', status: 'ACTIVE' }],
        count: 1,
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', amount: 100 }],
        count: 1,
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', amount: 100 }],
        count: 1,
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', status: 'PENDING' }],
        count: 1,
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', status: 'ACTIVE' }],
        count: 1,
        error: null,
      });

      const result = await service.getDashboardMetrics();

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.overview.totalUsers).toBe(1);
      expect(result.overview.totalTransactions).toBe(1);
      expect(result.recentMetrics).toBeDefined();
      expect(result.topMetrics).toBeDefined();
    });

    it('should cache metrics and return cached data on second call', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // First call
      await service.getDashboardMetrics();

      // Reset mock
      jest.clearAllMocks();
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Second call - should use cache
      const result = await service.getDashboardMetrics();

      expect(result).toBeDefined();
      // Supabase should not be called again due to caching
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionStats', () => {
    it('should return transaction statistics', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [
          { id: '1', amount: 100, currency: 'USD', status: 'COMPLETED', created_at: new Date().toISOString() },
          { id: '2', amount: 200, currency: 'EUR', status: 'COMPLETED', created_at: new Date().toISOString() },
        ],
        error: null,
      });

      const result = await service.getTransactionStats('7d');

      expect(result).toBeDefined();
      expect(result.totalVolume).toBe(300);
      expect(result.transactionCount).toBe(2);
      expect(result.averageAmount).toBe(150);
      expect(result.byCurrency).toBeDefined();
      expect(result.byStatus).toBeDefined();
      expect(result.timeline).toBeDefined();
    });

    it('should default to 7d period', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.getTransactionStats();

      expect(mockQuery.gte).toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      mockQuery.select.mockResolvedValueOnce({
        data: [
          { id: '1', status: 'ACTIVE', country: 'US', country_code: 'US', created_at: new Date().toISOString() },
          { id: '2', status: 'PENDING', country: 'FR', country_code: 'FR', created_at: new Date().toISOString() },
        ],
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.getUserStats();

      expect(result).toBeDefined();
      expect(result.totalUsers).toBe(2);
      expect(result.activeUsers).toBe(1);
      expect(result.byStatus).toBeDefined();
      expect(result.byCountry).toBeDefined();
      expect(result.growth).toBeDefined();
    });
  });

  describe('getKycStats', () => {
    it('should return KYC statistics', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [
          {
            id: '1',
            status: 'APPROVED',
            document_type: 'PASSPORT',
            created_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
          {
            id: '2',
            status: 'PENDING',
            document_type: 'ID_CARD',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const result = await service.getKycStats();

      expect(result).toBeDefined();
      expect(result.approved).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.approvalRate).toBe(50);
      expect(result.byDocumentType).toBeDefined();
      expect(result.timeline).toBeDefined();
    });
  });

  describe('getTimeSeriesData', () => {
    it('should return time series data', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const now = new Date().toISOString();
      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', amount: 100, created_at: now }],
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', created_at: now }],
        error: null,
      });

      mockQuery.select.mockResolvedValueOnce({
        data: [{ id: '1', created_at: now }],
        error: null,
      });

      const result = await service.getTimeSeriesData('7d');

      expect(result).toBeDefined();
      expect(result.period).toBe('7d');
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should support 30d and 90d periods', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result30d = await service.getTimeSeriesData('30d');
      const result90d = await service.getTimeSeriesData('90d');

      expect(result30d.period).toBe('30d');
      expect(result90d.period).toBe('90d');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Populate cache
      await service.getDashboardMetrics();

      // Clear cache
      service.clearCache();

      // Should call supabase again
      jest.clearAllMocks();
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await service.getDashboardMetrics();

      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });
  });
});
