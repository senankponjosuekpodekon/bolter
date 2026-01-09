import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService, PerformanceMetric } from './performance.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let mockSupabaseService: SupabaseService;

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn(),
    } as unknown as SupabaseService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMetric', () => {
    it('should record API performance metric', () => {
      const metric: PerformanceMetric = {
        timestamp: new Date(),
        endpoint: '/api/transactions',
        method: 'GET',
        responseTime: 150,
        statusCode: 200,
        tenantId: 'tenant-1',
      };

      expect(() => service.recordMetric(metric)).not.toThrow();
    });

    it('should record multiple metrics', () => {
      const metrics: PerformanceMetric[] = [
        {
          timestamp: new Date(),
          endpoint: '/api/transactions',
          method: 'GET',
          responseTime: 150,
          statusCode: 200,
          tenantId: 'tenant-1',
        },
        {
          timestamp: new Date(),
          endpoint: '/api/users',
          method: 'POST',
          responseTime: 250,
          statusCode: 201,
          tenantId: 'tenant-1',
        },
      ];

      metrics.forEach((m) => service.recordMetric(m));
      expect(() => service.recordMetric(metrics[0])).not.toThrow();
    });
  });

  describe('Cache statistics', () => {
    it('should record cache hit', () => {
      service.recordCacheHit();
      const stats = service.getCacheStats();

      expect(stats.cacheHits).toBeGreaterThan(0);
    });

    it('should record cache miss', () => {
      service.recordCacheMiss();
      const stats = service.getCacheStats();

      expect(stats.cacheMisses).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', () => {
      service.recordCacheHit();
      service.recordCacheHit();
      service.recordCacheMiss();

      const stats = service.getCacheStats();

      expect(stats.hitRate).toBe((2 / 3) * 100);
      expect(stats.totalRequests).toBe(3);
    });

    it('should return 0 hit rate when no requests', () => {
      const service2 = new PerformanceService(mockSupabaseService);
      const stats = service2.getCacheStats();

      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Endpoint statistics', () => {
    beforeEach(() => {
      // Add test metrics
      const now = new Date();
      service.recordMetric({
        timestamp: now,
        endpoint: '/api/transactions',
        method: 'GET',
        responseTime: 100,
        statusCode: 200,
        tenantId: 'tenant-1',
      });
      service.recordMetric({
        timestamp: new Date(now.getTime() + 1000),
        endpoint: '/api/transactions',
        method: 'GET',
        responseTime: 200,
        statusCode: 200,
        tenantId: 'tenant-1',
      });
      service.recordMetric({
        timestamp: new Date(now.getTime() + 2000),
        endpoint: '/api/transactions',
        method: 'GET',
        responseTime: 300,
        statusCode: 500,
        tenantId: 'tenant-1',
      });
    });

    it('should get endpoint statistics', () => {
      const stats = service.getEndpointStats('/api/transactions', 'GET');

      expect(stats).toBeDefined();
      expect(stats.endpoint).toBe('/api/transactions');
      expect(stats.method).toBe('GET');
      expect(stats.requestCount).toBe(3);
      expect(stats.avgResponseTime).toBeGreaterThan(0);
      expect(stats.errorRate).toBeGreaterThan(0);
    });

    it('should calculate percentiles', () => {
      const stats = service.getEndpointStats('/api/transactions', 'GET');

      expect(stats.p95ResponseTime).toBeGreaterThan(0);
      expect(stats.p99ResponseTime).toBeGreaterThan(0);
      expect(stats.p95ResponseTime).toBeGreaterThanOrEqual(stats.minResponseTime);
    });

    it('should get all endpoint statistics', () => {
      const allStats = service.getAllEndpointStats();

      expect(Array.isArray(allStats)).toBe(true);
      expect(allStats.length).toBeGreaterThan(0);
    });

    it('should get slowest endpoints', () => {
      const slowest = service.getSlowestEndpoints(5);

      expect(Array.isArray(slowest)).toBe(true);
      if (slowest.length > 1) {
        expect(slowest[0].avgResponseTime).toBeGreaterThanOrEqual(slowest[1].avgResponseTime);
      }
    });

    it('should get endpoints with highest error rates', () => {
      const highErrors = service.getHighestErrorRates(5);

      expect(Array.isArray(highErrors)).toBe(true);
      if (highErrors.length > 0) {
        expect(highErrors[0].errorRate).toBeGreaterThan(0);
      }
    });
  });

  describe('System metrics', () => {
    it('should get system metrics', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.heapUsed).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage.heapTotal).toBeGreaterThanOrEqual(0);
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should get system metrics history', () => {
      // Record some metrics
      service.getSystemMetrics();
      service.getSystemMetrics();

      const history = service.getSystemMetricsHistory(24);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard data', () => {
    it('should get dashboard data', () => {
      service.recordMetric({
        timestamp: new Date(),
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 150,
        statusCode: 200,
        tenantId: 'tenant-1',
      });

      const dashboard = service.getDashboardData('tenant-1');

      expect(dashboard).toBeDefined();
      expect(dashboard.totalRequests).toBeGreaterThanOrEqual(0);
      expect(dashboard.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(dashboard.errorRate).toBeGreaterThanOrEqual(0);
      expect(dashboard.statusCodeDistribution).toBeDefined();
      expect(dashboard.slowestEndpoints).toBeDefined();
      expect(dashboard.cacheStats).toBeDefined();
      expect(dashboard.systemMetrics).toBeDefined();
    });

    it('should return empty data when no metrics', () => {
      const service2 = new PerformanceService(mockSupabaseService);
      const dashboard = service2.getDashboardData('tenant-2');

      expect(dashboard.totalRequests).toBe(0);
      expect(dashboard.avgResponseTime).toBe(0);
    });
  });

  describe('Performance alerts', () => {
    it('should generate alert for slow endpoint', () => {
      // Add slow endpoint metric
      service.recordMetric({
        timestamp: new Date(),
        endpoint: '/api/slow',
        method: 'GET',
        responseTime: 6000, // > 5000ms
        statusCode: 200,
        tenantId: 'tenant-1',
      });

      const alerts = service.getPerformanceAlerts('tenant-1', 24);

      expect(Array.isArray(alerts)).toBe(true);
      const slowAlert = alerts.find((a) => a.type === 'slow_endpoint');
      expect(slowAlert).toBeDefined();
    });

    it('should generate alert for high error rate', () => {
      // Add multiple error metrics
      for (let i = 0; i < 6; i++) {
        service.recordMetric({
          timestamp: new Date(),
          endpoint: '/api/errors',
          method: 'GET',
          responseTime: 100,
          statusCode: 500,
          tenantId: 'tenant-1',
        });
      }

      // Add some successful requests
      for (let i = 0; i < 4; i++) {
        service.recordMetric({
          timestamp: new Date(),
          endpoint: '/api/errors',
          method: 'GET',
          responseTime: 100,
          statusCode: 200,
          tenantId: 'tenant-1',
        });
      }

      const alerts = service.getPerformanceAlerts('tenant-1', 24);

      const errorAlert = alerts.find((a) => a.type === 'high_error_rate');
      expect(errorAlert).toBeDefined();
    });

    it('should not generate alerts when performance is good', () => {
      const service2 = new PerformanceService(mockSupabaseService);
      
      service2.recordMetric({
        timestamp: new Date(),
        endpoint: '/api/good',
        method: 'GET',
        responseTime: 100,
        statusCode: 200,
        tenantId: 'tenant-1',
      });

      const alerts = service2.getPerformanceAlerts('tenant-1', 24);

      expect(alerts.length).toBe(0);
    });
  });

  describe('Time window filtering', () => {
    it('should filter metrics by time window', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago

      service.recordMetric({
        timestamp: oldDate,
        endpoint: '/api/old',
        method: 'GET',
        responseTime: 100,
        statusCode: 200,
        tenantId: 'tenant-1',
      });

      service.recordMetric({
        timestamp: now,
        endpoint: '/api/new',
        method: 'GET',
        responseTime: 100,
        statusCode: 200,
        tenantId: 'tenant-1',
      });

      const stats24h = service.getAllEndpointStats(24);

      expect(stats24h.some((s) => s.endpoint === '/api/old')).toBe(false);
      expect(stats24h.some((s) => s.endpoint === '/api/new')).toBe(true);
    });
  });
});
