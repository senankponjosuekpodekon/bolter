import { AdminService } from './admin.service';
import { DashboardMetricsDto, TransactionStatsDto, UserStatsDto, KycStatsDto, TimeSeriesDataDto } from './dto/dashboard-metrics.dto';
export declare class AdminDashboardController {
    private adminService;
    private readonly logger;
    constructor(adminService: AdminService);
    getDashboard(): Promise<DashboardMetricsDto>;
    getTransactionStats(period?: '7d' | '30d' | '90d'): Promise<TransactionStatsDto>;
    getUserStats(): Promise<UserStatsDto>;
    getKycStats(): Promise<KycStatsDto>;
    getTimelineData(period?: '7d' | '30d' | '90d'): Promise<TimeSeriesDataDto>;
}
