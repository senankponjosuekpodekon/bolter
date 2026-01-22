import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService, ReportQuery, ReportResult } from './analytics.service';
import { SupabaseService } from '../supabase/supabase.service';

type TableData = Record<string, unknown[]>;

const createMockClient = (tableData: TableData) => ({
  from: (table: string) => {
    const rows = tableData[table] ?? [];
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: (resolver: (value: { data: unknown[]; error: null }) => void) =>
        resolver({ data: rows, error: null }),
    };
    return builder;
  },
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let supabaseService: { getClient: jest.Mock; getAdminClient: jest.Mock };

  beforeEach(async () => {
    supabaseService = {
      getClient: jest.fn(() => createMockClient({})),
      getAdminClient: jest.fn(() => createMockClient({})),
    } as unknown as { getClient: jest.Mock; getAdminClient: jest.Mock };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: SupabaseService, useValue: supabaseService }],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error when required params are missing', async () => {
    await expect(service.generateReport({} as unknown as ReportQuery)).rejects.toThrow();
  });

  it('should throw error when startDate is after endDate', async () => {
    const query: ReportQuery = {
      type: 'transactions',
      startDate: new Date('2024-02-01'),
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

    supabaseService.getAdminClient.mockReturnValue(
      createMockClient({
        transactions: [
          { id: '1', amount: 1000, status: 'approved', created_at: '2024-01-15', tenant_id: 'tenant-1' },
        ],
      })
    );

    const report = await service.generateReport(query);

    expect(report.type).toBe('transactions');
    expect(report.data.length).toBeGreaterThan(0);
  });

  it('should generate user report', async () => {
    const query: ReportQuery = {
      type: 'users',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      tenantId: 'tenant-1',
    };

    supabaseService.getAdminClient.mockReturnValue(
      createMockClient({
        users: [
          { id: '1', status: 'active', created_at: '2024-01-15', tenant_id: 'tenant-1' },
          { id: '2', status: 'active', created_at: '2024-01-20', tenant_id: 'tenant-1' },
        ],
      })
    );

    const report = await service.generateReport(query);

    expect(report.type).toBe('users');
    expect(report.summary.totalRecords).toBe(2);
  });

  it('should export CSV and JSON', () => {
    const report: ReportResult = {
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
    const query: ReportQuery = {
      type: 'transactions',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      tenantId: 'tenant-1',
    };

    supabaseService.getClient.mockReturnValue(
      createMockClient({
        transactions: [
          { id: '1', amount: 1000, status: 'approved', created_at: '2024-01-15', tenant_id: 'tenant-1' },
          { id: '2', amount: 2000, status: 'approved', created_at: '2024-01-15', tenant_id: 'tenant-1' },
        ],
      })
    );

    const timeSeries = await service.getTimeSeriesData(query, 'daily');

    expect(Array.isArray(timeSeries)).toBe(true);
  });

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      const query: ReportQuery = {
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
      const query: ReportQuery = {
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
      } as unknown as ReportQuery;

      await expect(service.generateReport(query)).rejects.toThrow();
    });
  });
});
