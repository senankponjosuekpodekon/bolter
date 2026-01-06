import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('AdminService', () => {
  let service: AdminService;
  let mockSupabaseClient: Record<string, jest.Mock>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
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
