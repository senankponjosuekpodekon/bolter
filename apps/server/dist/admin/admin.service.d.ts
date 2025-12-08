import { SupabaseService } from '../supabase/supabase.service';
import { DashboardMetricsDto, TransactionStatsDto, UserStatsDto, KycStatsDto, TimeSeriesDataDto } from './dto/dashboard-metrics.dto';
export declare class AdminService {
    private supabase;
    private readonly logger;
    private metricsCache;
    private readonly CACHE_TTL;
    constructor(supabase: SupabaseService);
    getDashboardMetrics(): Promise<DashboardMetricsDto>;
    private getOverviewMetrics;
    private getRecentMetrics;
    private getTopMetrics;
    getTransactionStats(period?: '7d' | '30d' | '90d'): Promise<TransactionStatsDto>;
    getUserStats(): Promise<UserStatsDto>;
    getKycStats(): Promise<KycStatsDto>;
    getTimeSeriesData(period?: '7d' | '30d' | '90d'): Promise<TimeSeriesDataDto>;
    private buildTimeline;
    private aggregateByCurrency;
    private aggregateByStatus;
    private getUserStatusStats;
    private getCountryStats;
    private getUserGrowthStats;
    private getDocumentTypeStats;
    private getKycTimeline;
    private getFromCache;
    private setCache;
    clearCache(): void;
}
