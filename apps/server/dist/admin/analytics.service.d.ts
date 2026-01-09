import { SupabaseService } from '../supabase/supabase.service';
export interface ReportQuery {
    type: 'transactions' | 'users' | 'kyc' | 'loans' | 'accounts';
    startDate: Date;
    endDate: Date;
    filters?: Record<string, unknown>;
    groupBy?: string[];
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    tenantId: string;
}
export interface AnalyticsData {
    timestamp: Date;
    segment: string;
    value: number;
    trend?: number;
    metadata?: Record<string, unknown>;
}
export interface ReportResult {
    id: string;
    name: string;
    type: string;
    generatedAt: Date;
    data: AnalyticsData[];
    summary: {
        totalRecords: number;
        startDate: Date;
        endDate: Date;
        segments: number;
    };
}
export declare class AnalyticsService {
    private supabaseService;
    private readonly cacheMap;
    private readonly CACHE_TTL;
    constructor(supabaseService: SupabaseService);
    generateReport(query: ReportQuery): Promise<ReportResult>;
    private getTransactionAnalytics;
    private getUserAnalytics;
    private getKycAnalytics;
    private getLoanAnalytics;
    private getAccountAnalytics;
    private aggregateData;
    private performAggregation;
    exportToCSV(report: ReportResult): string;
    exportToJSON(report: ReportResult): string;
    getTimeSeriesData(query: ReportQuery, interval?: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<AnalyticsData[]>;
    private groupByTimeInterval;
    private getTimeKey;
    private getTimeStart;
    private generateReportId;
    private generateCacheKey;
    private getCache;
    private setCache;
    clearCache(queryType?: string): void;
}
