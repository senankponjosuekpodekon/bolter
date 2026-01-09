"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let PerformanceService = class PerformanceService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.metrics = [];
        this.systemMetricsHistory = [];
        this.cacheStats = {
            hits: 0,
            misses: 0,
        };
        this.MAX_METRICS = 10000;
        this.METRICS_RETENTION_HOURS = 24;
        this.cleanupMetrics();
    }
    recordMetric(metric) {
        this.metrics.push(metric);
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics.shift();
        }
    }
    recordCacheHit() {
        this.cacheStats.hits++;
    }
    recordCacheMiss() {
        this.cacheStats.misses++;
    }
    getEndpointStats(endpoint, method, hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const relevant = this.metrics.filter((m) => m.endpoint === endpoint && m.method === method && m.timestamp > cutoff);
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
    getAllEndpointStats(hours = 24) {
        const endpoints = new Map();
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
    getSlowestEndpoints(limit = 10, hours = 24) {
        return this.getAllEndpointStats(hours)
            .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
            .slice(0, limit);
    }
    getHighestErrorRates(limit = 10, hours = 24) {
        return this.getAllEndpointStats(hours)
            .filter((s) => s.errorRate > 0)
            .sort((a, b) => b.errorRate - a.errorRate)
            .slice(0, limit);
    }
    getCacheStats() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        return {
            cacheHits: this.cacheStats.hits,
            cacheMisses: this.cacheStats.misses,
            hitRate: total > 0 ? (this.cacheStats.hits / total) * 100 : 0,
            totalRequests: total,
        };
    }
    getSystemMetrics() {
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const systemMetric = {
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
            activeConnections: 0,
            timestamp: new Date(),
        };
        this.systemMetricsHistory.push(systemMetric);
        if (this.systemMetricsHistory.length > 1000) {
            this.systemMetricsHistory.shift();
        }
        return systemMetric;
    }
    getSystemMetricsHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.systemMetricsHistory.filter((m) => m.timestamp > cutoff);
    }
    getDashboardData(tenantId, hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const relevantMetrics = this.metrics.filter((m) => m.tenantId === tenantId && m.timestamp > cutoff);
        const statusCodes = new Map();
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
    getPerformanceAlerts(tenantId, hours = 1) {
        const alerts = [];
        const stats = this.getAllEndpointStats(hours);
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
    percentile(sorted, p) {
        if (sorted.length === 0)
            return 0;
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }
    cleanupMetrics() {
        setInterval(() => {
            const cutoff = new Date(Date.now() - this.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
            const initialLength = this.metrics.length;
            this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
            console.log(`Performance metrics cleanup: removed ${initialLength - this.metrics.length} old metrics`);
        }, 60 * 60 * 1000);
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map