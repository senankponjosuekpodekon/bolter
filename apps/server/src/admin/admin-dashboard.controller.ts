import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  DashboardMetricsDto,
  TransactionStatsDto,
  UserStatsDto,
  KycStatsDto,
  TimeSeriesDataDto,
} from './dto/dashboard-metrics.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  private readonly logger = new Logger(AdminDashboardController.name);

  constructor(private adminService: AdminService) { }

  /**
   * Get comprehensive dashboard metrics
   * GET /admin/dashboard
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(): Promise<DashboardMetricsDto> {
    this.logger.log('Fetching dashboard metrics');
    return this.adminService.getDashboardMetrics();
  }

  /**
   * Get transaction statistics
   * GET /admin/stats/transactions?period=7d
   */
  @Get('stats/transactions')
  @HttpCode(HttpStatus.OK)
  async getTransactionStats(
    @Query('period') period: '7d' | '30d' | '90d' = '7d',
  ): Promise<TransactionStatsDto> {
    this.logger.log(`Fetching transaction stats for period: ${period}`);
    if (!['7d', '30d', '90d'].includes(period)) {
      period = '7d';
    }
    return this.adminService.getTransactionStats(period);
  }

  /**
   * Get user statistics
   * GET /admin/stats/users
   */
  @Get('stats/users')
  @HttpCode(HttpStatus.OK)
  async getUserStats(): Promise<UserStatsDto> {
    this.logger.log('Fetching user stats');
    return this.adminService.getUserStats();
  }

  /**
   * Get KYC statistics
   * GET /admin/stats/kyc
   */
  @Get('stats/kyc')
  @HttpCode(HttpStatus.OK)
  async getKycStats(): Promise<KycStatsDto> {
    this.logger.log('Fetching KYC stats');
    return this.adminService.getKycStats();
  }

  /**
   * Get time series data for charts
   * GET /admin/stats/timeline?period=7d
   */
  @Get('stats/timeline')
  @HttpCode(HttpStatus.OK)
  async getTimelineData(
    @Query('period') period: '7d' | '30d' | '90d' = '7d',
  ): Promise<TimeSeriesDataDto> {
    this.logger.log(`Fetching timeline data for period: ${period}`);
    if (!['7d', '30d', '90d'].includes(period)) {
      period = '7d';
    }
    return this.adminService.getTimeSeriesData(period);
  }
}
