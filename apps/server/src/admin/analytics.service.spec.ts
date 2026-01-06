import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService, ReportQuery } from './analytics.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should throw error if required parameters are missing', async () => {
      const incompleteQuery: any = {
        type: 'transactions',
      };

      await expect(service.generateReport(incompleteQuery)).rejects.toThrow();
    });

    it('should throw error if startDate is after endDate', async () => {
      const query: ReportQuery = {
        type: 'transactions',
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'),
        tenantId: 'tenant-1',
      };

      await expect(service.generateReport(query)).rejects.toThrow();
    });

    it('should generate transaction report', async () => {
      const query: ReportQuery = {
        type: 'transactions',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        tenantId: 'tenant-1',
      };

      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({
            data: [
              { id: '1', amount: 1000, status: 'approved', created_at: '2024-01-15' },
              { id: '2', amount: 2000, status: 'approved', created_at: '2024-01-20' },
            ],
            error: null,
          }),
        }),
      });

      const report = await service.generateReport(query);

      expect(report).toBeDefined();
      expect(report.type).toBe('transactions');
      expect(report.data.length).toBeGreaterThan(0);
    });

    it('should generate user report', async () => {
      const query: ReportQuery = {
        type: 'users',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        tenantId: 'tenant-1',
      };getClient = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({
            data: [
              { id: '1', created_at: '2024-01-15', status: 'active' },
              { id: '2', created_at: '2024-01-20', status: 'active' },
            ],
            error: null,
          }), created_at: '2024-01-20', status: 'active' },
          ],
          error: null,
        }),
      });

      const report = await service.generateReport(query);

      expect(report).toBeDefined();
      expect(report.type).toBe('users');
    });

    it('should generate kyc report', async () => {
      const query: ReportQuery = {
        type: 'kyc',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        tenantId: 'tenant-1',
      };getClient = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({
            data: [
              { id: '1', status: 'approved', created_at: '2024-01-15', document_type: 'id' },
            ],
            error: null,
          }), status: 'approved', created_at: '2024-01-15', document_type: 'id' },
          ],
          error: null,
        }),
      });

      const report = await service.generateReport(query);

      expect(report).toBeDefined();
      expect(report.type).toBe('kyc');
    });
  });

  describe('exportToCSV', () => {
    it('should export report to CSV format', () => {
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

      expect(csv).toBeDefined();
      expect(csv).toContain('timestamp');
      expect(csv).toContain('segment');
      expect(csv).toContain('value');
    });
  });

  describe('exportToJSON', () => {
    it('should export report to JSON format', () => {
      const report = {
        id: 'rpt_123',
        name: 'Test Report',
        type: 'transactions',
        generatedAt: new Date(),
        data: [
          { timestamp: new Date('2024-01-15'), segment: 'approved', value: 1000 },
        ],
        summary: {
          totalRecords: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          segments: 1,
        },
      };

      const json = service.exportToJSON(report);

      expect(json).toBeDefined();
      expect(JSON.parse(json)).toBeDefined();
      expect(JSON.parse(json).type).toBe('transactions');
    });
  });

  describe('getTimeSeriesData', () => {
    it('should return time-series data grouped by daily interval', async () => {
      const query: ReportQuery = {
        type: 'transactions',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        tenantId: 'tenant-1',
      };

      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { id: '1', amount: 1000, status: 'approved', created_at: '2024-01-15' },
            { id: '2', amount: 2000, status: 'approved', created_at: '2024-01-15' },
          ],
          error: null,
        }),
      });

      const timeSeries = await service.getTimeSeriesData(query, 'daily');

      expect(timeSeries).toBeDefined();
      expect(Array.isArray(timeSeries)).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      const query: ReportQuery = {
        type: 'transactions',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        tenantId: 'tenant-1',
      };getClient = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          })().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      // Generate report to cache it
      await service.generateReport(query);

      // Clear cache
      service.clearCache();

      // Should not error
      expect(() => service.clearCache()).not.toThrow();
    });

    it('should clear cache by type', async () => {
      service.clearCache('transactions');

      expect(() => service.clearCache('transactions')).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should throw error on invalid report type', async () => {
      const query: any = {
        type: 'invalid',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        tenantId: 'tenant-1',
      };

      await expect(service.generateReport(query)).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      const query: ReportQuery = {
        type: 'transactions',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        tenantId: 'tenant-1',
      };

      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      await expect(service.generateReport(query)).rejects.toThrow();
    });
  });
});
