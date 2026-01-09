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
export declare class PerformanceService {
    private supabaseService;
    private metrics;
    private systemMetricsHistory;
    private cacheStats;
    private readonly MAX_METRICS;
    private readonly METRICS_RETENTION_HOURS;
    constructor(supabaseService: SupabaseService);
    recordMetric(metric: PerformanceMetric): void;
    recordCacheHit(): void;
    recordCacheMiss(): void;
    getEndpointStats(endpoint: string, method: string, hours?: number): PerformanceStats;
    getAllEndpointStats(hours?: number): PerformanceStats[];
    getSlowestEndpoints(limit?: number, hours?: number): PerformanceStats[];
    getHighestErrorRates(limit?: number, hours?: number): PerformanceStats[];
    getCacheStats(): CacheStats;
    getSystemMetrics(): SystemMetrics;
    getSystemMetricsHistory(hours?: number): SystemMetrics[];
    getDashboardData(tenantId: string, hours?: number): Record<string, unknown>;
    getPerformanceAlerts(tenantId: string, hours?: number): Array<Record<string, unknown>>;
    private percentile;
    private cleanupMetrics;
}
