import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  DashboardMetricsDto,
  OverviewMetrics,
  RecentMetrics,
  TopMetrics,
  TransactionStatsDto,
  UserStatsDto,
  KycStatsDto,
  TimeSeriesDataDto,
  TimeSeriesPoint,
  CurrencyStats,
  StatusStats,
  UserStatusStats,
  CountryStats,
  DocumentTypeStats,
  KycTimelinePoint,
} from './dto/dashboard-metrics.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private supabase: SupabaseService) { }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    const cacheKey = 'dashboard_metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [overview, recentMetrics, topMetrics] = await Promise.all([
        this.getOverviewMetrics(),
        this.getRecentMetrics('7d'),
        this.getTopMetrics(),
      ]);

      const result: DashboardMetricsDto = {
        overview,
        recentMetrics,
        topMetrics,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error('Failed to get dashboard metrics', error);
      throw error;
    }
  }

  /**
   * Get overview metrics (all-time and today)
   */
  private async getOverviewMetrics(): Promise<OverviewMetrics> {
    const admin = this.supabase.getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const [
      usersResult,
      transactionsResult,
      todayTransactionsResult,
      kycResult,
      loansResult,
    ] = await Promise.all([
      admin.from('users').select('id, status', { count: 'exact' }),
      admin.from('transactions').select('id, amount', { count: 'exact' }),
      admin
        .from('transactions')
        .select('id, amount', { count: 'exact' })
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`),
      admin.from('kyc_applications').select('id, status', { count: 'exact' }),
      admin.from('loans').select('id, status', { count: 'exact' }),
    ]);

    const totalUsers = usersResult.count || 0;
    const activeUsers =
      usersResult.data?.filter((u: any) => u.status === 'ACTIVE').length || 0;
    const totalTransactions = transactionsResult.count || 0;
    const totalTransactionVolume = (transactionsResult.data || []).reduce(
      (sum: number, t: any) => sum + (t.amount || 0),
      0,
    );
    const averageTransactionAmount =
      totalTransactions > 0 ? totalTransactionVolume / totalTransactions : 0;

    const kycData = kycResult.data || [];
    const pendingKyc = kycData.filter((k: any) => k.status === 'PENDING').length;
    const approvedKyc = kycData.filter((k: any) => k.status === 'APPROVED').length;
    const rejectedKyc = kycData.filter((k: any) => k.status === 'REJECTED').length;

    const loanData = loansResult.data || [];
    const totalLoans = loansResult.count || 0;
    const activeLoans = loanData.filter((l: any) => l.status === 'ACTIVE').length;

    const todayCount = todayTransactionsResult.count || 0;
    const todayVolume = (todayTransactionsResult.data || []).reduce(
      (sum: number, t: any) => sum + (t.amount || 0),
      0,
    );

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalTransactionVolume,
      averageTransactionAmount: Math.round(averageTransactionAmount * 100) / 100,
      pendingKycApplications: pendingKyc,
      approvedKycApplications: approvedKyc,
      rejectedKycApplications: rejectedKyc,
      totalLoans,
      activeLoanAccounts: activeLoans,
      todaysTransactionCount: todayCount,
      todaysTransactionVolume: todayVolume,
    };
  }

  /**
   * Get recent metrics for a given period
   */
  private async getRecentMetrics(period: '7d' | '30d' | '90d'): Promise<RecentMetrics> {
    const admin = this.supabase.getAdminClient();
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [userGrowth, transactionGrowth, kycStats] = await Promise.all([
      admin
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      admin
        .from('transactions')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString()),
      admin
        .from('kyc_applications')
        .select('id, status, created_at, approved_at')
        .gte('created_at', startDate.toISOString()),
    ]);

    // Calculate growth rates (simplified)
    const userGrowthRate = userGrowth.data?.length || 0;
    const transactionGrowthRate = transactionGrowth.data?.length || 0;

    const kycData = kycStats.data || [];
    const kycApproved = kycData.filter((k: any) => k.status === 'APPROVED').length;
    const kycApprovalRate = kycData.length > 0 ? (kycApproved / kycData.length) * 100 : 0;

    // Calculate average processing time
    let totalProcessingTime = 0;
    let processedCount = 0;
    kycData.forEach((k: any) => {
      if (k.approved_at && k.created_at) {
        const created = new Date(k.created_at);
        const approved = new Date(k.approved_at);
        totalProcessingTime += (approved.getTime() - created.getTime()) / (1000 * 60 * 60);
        processedCount++;
      }
    });

    const averageProcessingTime =
      processedCount > 0 ? totalProcessingTime / processedCount : 0;

    return {
      lastUpdated: new Date(),
      period,
      userGrowthRate: userGrowthRate,
      transactionGrowthRate: transactionGrowthRate,
      kycApprovalRate: Math.round(kycApprovalRate * 100) / 100,
      averageKycProcessingTime: Math.round(averageProcessingTime * 100) / 100,
    };
  }

  /**
   * Get top metrics (top date, top user, top currency)
   */
  private async getTopMetrics(): Promise<TopMetrics> {
    const admin = this.supabase.getAdminClient();

    const [transactions, users] = await Promise.all([
      admin.from('transactions').select('*').order('created_at', { ascending: false }).limit(1000),
      admin.from('users').select('*').limit(1000),
    ]);

    // Top transaction date
    const txByDate = new Map<string, { volume: number; count: number }>();
    (transactions.data || []).forEach((tx: any) => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      if (!txByDate.has(date)) {
        txByDate.set(date, { volume: 0, count: 0 });
      }
      const current = txByDate.get(date)!;
      current.volume += tx.amount || 0;
      current.count++;
    });

    let topDate = { date: '', volume: 0, count: 0 };
    txByDate.forEach((value, key) => {
      if (value.volume > topDate.volume) {
        topDate = { date: key, ...value };
      }
    });

    // Top user
    const userTxVolume = new Map<string, { volume: number; count: number; email: string }>();
    (transactions.data || []).forEach((tx: any) => {
      if (!userTxVolume.has(tx.user_id)) {
        const user = (users.data || []).find((u: any) => u.id === tx.user_id);
        userTxVolume.set(tx.user_id, { volume: 0, count: 0, email: user?.email || 'unknown' });
      }
      const current = userTxVolume.get(tx.user_id)!;
      current.volume += tx.amount || 0;
      current.count++;
    });

    let topUser = { userId: '', email: '', transactionCount: 0, totalVolume: 0 };
    userTxVolume.forEach((value, key) => {
      if (value.volume > topUser.totalVolume) {
        topUser = {
          userId: key,
          email: value.email,
          transactionCount: value.count,
          totalVolume: value.volume,
        };
      }
    });

    // Top currency
    const txByCurrency = new Map<string, { volume: number; count: number }>();
    (transactions.data || []).forEach((tx: any) => {
      const currency = tx.currency || 'USD';
      if (!txByCurrency.has(currency)) {
        txByCurrency.set(currency, { volume: 0, count: 0 });
      }
      const current = txByCurrency.get(currency)!;
      current.volume += tx.amount || 0;
      current.count++;
    });

    let topCurrency = { code: '', count: 0, volume: 0 };
    txByCurrency.forEach((value, key) => {
      if (value.volume > topCurrency.volume) {
        topCurrency = { code: key, ...value };
      }
    });

    return {
      topTransactionDate: topDate,
      topUser,
      topCurrency,
    };
  }

  /**
   * Get transaction statistics for a period
   */
  async getTransactionStats(period: '7d' | '30d' | '90d' = '7d'): Promise<TransactionStatsDto> {
    const cacheKey = `transaction_stats_${period}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const admin = this.supabase.getAdminClient();
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data: transactions } = await admin
      .from('transactions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const txData = transactions || [];
    const totalVolume = txData.reduce((sum, t: any) => sum + (t.amount || 0), 0);
    const amounts = txData.map((t: any) => t.amount || 0).filter((a) => a > 0);
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;

    // Timeline
    const timeline = this.buildTimeline(txData, period);

    // By currency
    const byCurrency = this.aggregateByCurrency(txData);

    // By status
    const byStatus = this.aggregateByStatus(txData);

    const result: TransactionStatsDto = {
      totalVolume,
      transactionCount: txData.length,
      averageAmount: Math.round(avgAmount * 100) / 100,
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts),
      timeline,
      byCurrency,
      byStatus,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStatsDto> {
    const cacheKey = 'user_stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const admin = this.supabase.getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: allUsers } = await admin.from('users').select('*');
    const { data: todayUsers } = await admin
      .from('users')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);
    const { data: weekUsers } = await admin
      .from('users')
      .select('*')
      .gte('created_at', weekAgo.toISOString());

    const users = allUsers || [];
    const activeUsers = users.filter((u: any) => u.status === 'ACTIVE').length;
    const byStatus = this.getUserStatusStats(users);
    const byCountry = this.getCountryStats(users);
    const growth = this.getUserGrowthStats(users);

    const result: UserStatsDto = {
      totalUsers: users.length,
      activeUsers,
      newUsersToday: todayUsers?.length || 0,
      newUsersThisWeek: weekUsers?.length || 0,
      byStatus,
      byCountry,
      growth,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get KYC statistics
   */
  async getKycStats(): Promise<KycStatsDto> {
    const cacheKey = 'kyc_stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const admin = this.supabase.getAdminClient();
    const { data: kycApps } = await admin.from('kyc_applications').select('*');

    const apps = kycApps || [];
    const pending = apps.filter((k: any) => k.status === 'PENDING').length;
    const approved = apps.filter((k: any) => k.status === 'APPROVED').length;
    const rejected = apps.filter((k: any) => k.status === 'REJECTED').length;

    const approvalRate = apps.length > 0 ? (approved / apps.length) * 100 : 0;
    const rejectionRate = apps.length > 0 ? (rejected / apps.length) * 100 : 0;

    let totalProcessingTime = 0;
    let processedCount = 0;
    apps.forEach((k: any) => {
      if (k.approved_at && k.created_at) {
        const created = new Date(k.created_at);
        const approved = new Date(k.approved_at);
        totalProcessingTime += (approved.getTime() - created.getTime()) / (1000 * 60 * 60);
        processedCount++;
      }
    });

    const avgProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;

    const byDocumentType = this.getDocumentTypeStats(apps);
    const timeline = this.getKycTimeline(apps);

    const result: KycStatsDto = {
      pending,
      approved,
      rejected,
      averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
      approvalRate: Math.round(approvalRate * 100) / 100,
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      byDocumentType,
      timeline,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(period: '7d' | '30d' | '90d' = '7d'): Promise<TimeSeriesDataDto> {
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const admin = this.supabase.getAdminClient();

    const [transactions, users, kycApps] = await Promise.all([
      admin.from('transactions').select('*').gte('created_at', startDate.toISOString()),
      admin.from('users').select('*').gte('created_at', startDate.toISOString()),
      admin.from('kyc_applications').select('*').gte('created_at', startDate.toISOString()),
    ]);

    const data: TimeSeriesPoint[] = [];
    const dateMap = new Map<string, TimeSeriesPoint>();

    // Build timeline
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        transactions: 0,
        users: 0,
        kycSubmissions: 0,
        revenue: 0,
      });
    }

    // Aggregate transactions
    (transactions.data || []).forEach((tx: any) => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const point = dateMap.get(date);
      if (point) {
        point.transactions++;
        point.revenue += tx.amount || 0;
      }
    });

    // Aggregate users
    (users.data || []).forEach((u: any) => {
      const date = new Date(u.created_at).toISOString().split('T')[0];
      const point = dateMap.get(date);
      if (point) {
        point.users++;
      }
    });

    // Aggregate KYC
    (kycApps.data || []).forEach((k: any) => {
      const date = new Date(k.created_at).toISOString().split('T')[0];
      const point = dateMap.get(date);
      if (point) {
        point.kycSubmissions++;
      }
    });

    // Sort by date
    const sorted = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      period,
      data: sorted,
    };
  }

  // Helper methods

  private buildTimeline(
    txData: any[],
    period: '7d' | '30d' | '90d',
  ): Array<{ date: string; volume: number; count: number; average: number }> {
    const timelineMap = new Map<
      string,
      { volume: number; count: number; average: number }
    >();

    txData.forEach((tx: any) => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      if (!timelineMap.has(date)) {
        timelineMap.set(date, { volume: 0, count: 0, average: 0 });
      }
      const current = timelineMap.get(date)!;
      current.volume += tx.amount || 0;
      current.count++;
    });

    // Calculate averages
    timelineMap.forEach((value) => {
      value.average = value.count > 0 ? Math.round((value.volume / value.count) * 100) / 100 : 0;
    });

    return Array.from(timelineMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private aggregateByCurrency(txData: any[]): CurrencyStats[] {
    const currencyMap = new Map<string, { count: number; volume: number }>();

    txData.forEach((tx: any) => {
      const currency = tx.currency || 'USD';
      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, { count: 0, volume: 0 });
      }
      const current = currencyMap.get(currency)!;
      current.count++;
      current.volume += tx.amount || 0;
    });

    const total = txData.length;
    return Array.from(currencyMap.entries())
      .map(([currency, data]) => ({
        currency,
        count: data.count,
        volume: data.volume,
        percentage: Math.round((data.count / total) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.volume - a.volume);
  }

  private aggregateByStatus(txData: any[]): StatusStats[] {
    const statusMap = new Map<string, number>();

    txData.forEach((tx: any) => {
      const status = tx.status || 'COMPLETED';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const total = txData.length;
    return Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / total) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private getUserStatusStats(users: any[]): UserStatusStats[] {
    const statusMap = new Map<string, number>();

    users.forEach((u: any) => {
      const status = u.status || 'PENDING';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const total = users.length;
    return Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / total) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private getCountryStats(users: any[]): CountryStats[] {
    const countryMap = new Map<string, { count: number; code: string }>();

    users.forEach((u: any) => {
      const country = u.country || 'Unknown';
      const code = u.country_code || 'XX';
      if (!countryMap.has(country)) {
        countryMap.set(country, { count: 0, code });
      }
      countryMap.get(country)!.count++;
    });

    const total = users.length;
    return Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        code: data.code,
        count: data.count,
        percentage: Math.round((data.count / total) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 countries
  }

  private getUserGrowthStats(users: any[]): Array<{ date: string; count: number; newUsers: number }> {
    const growthMap = new Map<string, { count: number; newUsers: number }>();
    const sortedUsers = [...users].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    let totalCount = 0;
    sortedUsers.forEach((u: any) => {
      const date = new Date(u.created_at).toISOString().split('T')[0];
      totalCount++;
      if (!growthMap.has(date)) {
        growthMap.set(date, { count: 0, newUsers: 0 });
      }
      const current = growthMap.get(date)!;
      current.newUsers++;
      current.count = totalCount;
    });

    return Array.from(growthMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private getDocumentTypeStats(apps: any[]): DocumentTypeStats[] {
    const docMap = new Map<string, { pending: number; approved: number; rejected: number }>();

    apps.forEach((k: any) => {
      const docType = k.document_type || 'PASSPORT';
      if (!docMap.has(docType)) {
        docMap.set(docType, { pending: 0, approved: 0, rejected: 0 });
      }
      const current = docMap.get(docType)!;
      if (k.status === 'PENDING') current.pending++;
      else if (k.status === 'APPROVED') current.approved++;
      else if (k.status === 'REJECTED') current.rejected++;
    });

    return Array.from(docMap.entries())
      .map(([docType, stats]) => ({
        documentType: docType,
        ...stats,
      }))
      .sort((a, b) => b.pending + b.approved + b.rejected - (a.pending + a.approved + a.rejected));
  }

  private getKycTimeline(apps: any[]): KycTimelinePoint[] {
    const timelineMap = new Map<
      string,
      { submitted: number; approved: number; rejected: number }
    >();

    apps.forEach((k: any) => {
      const date = new Date(k.created_at).toISOString().split('T')[0];
      if (!timelineMap.has(date)) {
        timelineMap.set(date, { submitted: 0, approved: 0, rejected: 0 });
      }
      const current = timelineMap.get(date)!;
      current.submitted++;
      if (k.status === 'APPROVED') current.approved++;
      else if (k.status === 'REJECTED') current.rejected++;
    });

    return Array.from(timelineMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private getFromCache(key: string): any | null {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.metricsCache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached metrics
   */
  clearCache(): void {
    this.metricsCache.clear();
  }
}
