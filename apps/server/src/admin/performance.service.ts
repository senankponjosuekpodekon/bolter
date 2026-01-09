import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface PerformanceMetric {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  tenantId: string;
}

export interface PerformanceStats {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  requestCount: number;
  lastUpdated: Date;
}

export interface CacheStats {
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalRequests: number;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  activeConnections: number;
  timestamp: Date;
}

@Injectable()
export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private systemMetricsHistory: SystemMetrics[] = [];
  private cacheStats = {
    hits: 0,
    misses: 0,
  };

  private readonly MAX_METRICS = 10000; // Keep last 10k metrics
  private readonly METRICS_RETENTION_HOURS = 24;

  constructor(private supabaseService: SupabaseService) {
    this.cleanupMetrics();
  }

  /**
   * Record API request performance
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep array size manageable
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheStats.hits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheStats.misses++;
  }

  /**
   * Get performance stats for specific endpoint
   */
  getEndpointStats(endpoint: string, method: string, hours: number = 24): PerformanceStats {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevant = this.metrics.filter(
      (m) => m.endpoint === endpoint && m.method === method && m.timestamp > cutoff,
    );

    if (relevant.length === 0) {
      return {
        endpoint,
        method,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        requestCount: 0,
        lastUpdated: new Date(),
      };
    }

    const responseTimes = relevant.map((m) => m.responseTime).sort((a, b) => a - b);
    const errorCount = relevant.filter((m) => m.statusCode >= 400).length;

    return {
      endpoint,
      method,
      avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
      minResponseTime: responseTimes[0],
      maxResponseTime: responseTimes[responseTimes.length - 1],
      p95ResponseTime: this.percentile(responseTimes, 95),
      p99ResponseTime: this.percentile(responseTimes, 99),
      errorRate: (errorCount / relevant.length) * 100,
      requestCount: relevant.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all endpoint statistics
   */
  getAllEndpointStats(hours: number = 24): PerformanceStats[] {
    const endpoints = new Map<string, PerformanceStats>();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const relevant = this.metrics.filter((m) => m.timestamp > cutoff);

    for (const metric of relevant) {
      const key = `${metric.method}:${metric.endpoint}`;

      if (!endpoints.has(key)) {
        endpoints.set(key, this.getEndpointStats(metric.endpoint, metric.method, hours));
      }
    }

    return Array.from(endpoints.values());
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit: number = 10, hours: number = 24): PerformanceStats[] {
    return this.getAllEndpointStats(hours)
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit);
  }

  /**
   * Get endpoints with highest error rates
   */
  getHighestErrorRates(limit: number = 10, hours: number = 24): PerformanceStats[] {
    return this.getAllEndpointStats(hours)
      .filter((s) => s.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const total = this.cacheStats.hits + this.cacheStats.misses;

    return {
      cacheHits: this.cacheStats.hits,
      cacheMisses: this.cacheStats.misses,
      hitRate: total > 0 ? (this.cacheStats.hits / total) * 100 : 0,
      totalRequests: total,
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const systemMetric: SystemMetrics = {
      uptime: Math.round(uptime),
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      cpuUsage: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000),
      },
      activeConnections: 0, // Would need actual connection tracking
      timestamp: new Date(),
    };

    this.systemMetricsHistory.push(systemMetric);

    // Keep history limited
    if (this.systemMetricsHistory.length > 1000) {
      this.systemMetricsHistory.shift();
    }

    return systemMetric;
  }

  /**
   * Get system metrics history
   */
  getSystemMetricsHistory(hours: number = 24): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.systemMetricsHistory.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Get performance dashboard data
   */
  getDashboardData(tenantId: string, hours: number = 24): Record<string, unknown> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevantMetrics = this.metrics.filter(
      (m) => m.tenantId === tenantId && m.timestamp > cutoff,
    );

    const statusCodes = new Map<number, number>();
    let totalResponseTime = 0;

    for (const metric of relevantMetrics) {
      const code = metric.statusCode;
      statusCodes.set(code, (statusCodes.get(code) || 0) + 1);
      totalResponseTime += metric.responseTime;
    }

    const errorCount = Array.from(statusCodes.entries())
      .filter(([code]) => code >= 400)
      .reduce((sum, [, count]) => sum + count, 0);

    return {
      totalRequests: relevantMetrics.length,
      avgResponseTime: relevantMetrics.length > 0 ? Math.round(totalResponseTime / relevantMetrics.length) : 0,
      errorRate: relevantMetrics.length > 0 ? (errorCount / relevantMetrics.length) * 100 : 0,
      statusCodeDistribution: Object.fromEntries(statusCodes),
      slowestEndpoints: this.getSlowestEndpoints(5, hours),
      highErrorRates: this.getHighestErrorRates(5, hours),
      cacheStats: this.getCacheStats(),
      systemMetrics: this.getSystemMetrics(),
    };
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(tenantId: string, hours: number = 1): Array<Record<string, unknown>> {
    const alerts: Array<Record<string, unknown>> = [];
    const stats = this.getAllEndpointStats(hours);

    // Alert on slow endpoints
    for (const stat of stats) {
      if (stat.avgResponseTime > 5000) {
        alerts.push({
          type: 'slow_endpoint',
          severity: 'warning',
          message: `${stat.method} ${stat.endpoint} is slow (avg ${stat.avgResponseTime}ms)`,
          timestamp: new Date(),
          metric: stat,
        });
      }

      if (stat.errorRate > 10) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'error',
          message: `${stat.method} ${stat.endpoint} has high error rate (${stat.errorRate.toFixed(2)}%)`,
          timestamp: new Date(),
          metric: stat,
        });
      }
    }

    // Alert on memory usage
    const memMetrics = this.getSystemMetricsHistory(hours);
    if (memMetrics.length > 0) {
      const latest = memMetrics[memMetrics.length - 1];
      const heapUsagePercent = (latest.memoryUsage.heapUsed / latest.memoryUsage.heapTotal) * 100;

      if (heapUsagePercent > 80) {
        alerts.push({
          type: 'high_memory_usage',
          severity: 'warning',
          message: `Memory usage is high (${heapUsagePercent.toFixed(2)}%)`,
          timestamp: new Date(),
          metric: latest.memoryUsage,
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;

    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Cleanup old metrics
   */
  private cleanupMetrics(): void {
    setInterval(() => {
      const cutoff = new Date(Date.now() - this.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
      const initialLength = this.metrics.length;

      this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);

      console.log(
        `Performance metrics cleanup: removed ${initialLength - this.metrics.length} old metrics`,
      );
    }, 60 * 60 * 1000); // Cleanup hourly
  }
}
