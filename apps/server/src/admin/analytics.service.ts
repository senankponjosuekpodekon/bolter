import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface ReportQuery {
  type: 'transactions' | 'users' | 'kyc' | 'loans' | 'accounts';
  startDate: Date;
  endDate: Date;
  filters?: Record<string, any>;
  groupBy?: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  tenantId: string;
}

export interface AnalyticsData {
  timestamp: Date;
  segment: string;
  value: number;
  trend?: number;
  metadata?: Record<string, any>;
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

@Injectable()
export class AnalyticsService {
  private readonly cacheMap = new Map<string, { data: any; expiresAt: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Generate custom analytics report based on query parameters
   */
  async generateReport(query: ReportQuery): Promise<ReportResult> {
    if (!query.type || !query.startDate || !query.endDate) {
      throw new BadRequestException('Missing required report parameters: type, startDate, endDate');
    }

    if (new Date(query.startDate) >= new Date(query.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const cacheKey = this.generateCacheKey(query);
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    let data: AnalyticsData[] = [];

    switch (query.type) {
      case 'transactions':
        data = await this.getTransactionAnalytics(query);
        break;
      case 'users':
        data = await this.getUserAnalytics(query);
        break;
      case 'kyc':
        data = await this.getKycAnalytics(query);
        break;
      case 'loans':
        data = await this.getLoanAnalytics(query);
        break;
      case 'accounts':
        data = await this.getAccountAnalytics(query);
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${query.type}`);
    }

    const result: ReportResult = {
      id: this.generateReportId(),
      name: `${query.type} Report - ${new Date().toISOString()}`,
      type: query.type,
      generatedAt: new Date(),
      data,
      summary: {
        totalRecords: data.length,
        startDate: query.startDate,
        endDate: query.endDate,
        segments: new Set(data.map((d) => d.segment)).size,
      },
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get transaction analytics with aggregations
   */
  private async getTransactionAnalytics(query: ReportQuery): Promise<AnalyticsData[]> {
    const supabaseClient = this.supabaseService.getClient();
    let queryBuilder = supabaseClient
      .from('transactions')
      .select('id, amount, status, created_at, category')
      .eq('tenant_id', query.tenantId)
      .gte('created_at', query.startDate.toISOString())
      .lte('created_at', query.endDate.toISOString());

    if (query.filters?.status) {
      queryBuilder = queryBuilder.eq('status', query.filters.status);
    }

    const { data, error } = await queryBuilder;
    if (error) throw new BadRequestException(`Failed to fetch transaction data: ${error.message}`);

    return this.aggregateData(data || [], query.groupBy || ['status'], query.aggregation || 'sum');
  }

  /**
   * Get user analytics with growth trends
   */
  private async getUserAnalytics(query: ReportQuery): Promise<AnalyticsData[]> {
    const supabaseClient = this.supabaseService.getClient();

    const { data, error } = await supabaseClient
      .from('users')
      .select('id, created_at, status')
      .eq('tenant_id', query.tenantId)
      .gte('created_at', query.startDate.toISOString())
      .lte('created_at', query.endDate.toISOString());

    if (error) throw new BadRequestException(`Failed to fetch user data: ${error.message}`);

    return this.aggregateData(data || [], query.groupBy || ['status'], 'count');
  }

  /**
   * Get KYC analytics with approval rates
   */
  private async getKycAnalytics(query: ReportQuery): Promise<AnalyticsData[]> {
    const supabaseClient = this.supabaseService.getClient();

    const { data, error } = await supabaseClient
      .from('kyc_documents')
      .select('id, status, created_at, document_type')
      .eq('tenant_id', query.tenantId)
      .gte('created_at', query.startDate.toISOString())
      .lte('created_at', query.endDate.toISOString());

    if (error) throw new BadRequestException(`Failed to fetch KYC data: ${error.message}`);

    return this.aggregateData(data || [], query.groupBy || ['status'], 'count');
  }

  /**
   * Get loan analytics with disbursement trends
   */
  private async getLoanAnalytics(query: ReportQuery): Promise<AnalyticsData[]> {
    const supabaseClient = this.supabaseService.getClient();

    const { data, error } = await supabaseClient
      .from('loans')
      .select('id, amount, status, created_at, loan_type')
      .eq('tenant_id', query.tenantId)
      .gte('created_at', query.startDate.toISOString())
      .lte('created_at', query.endDate.toISOString());

    if (error) throw new BadRequestException(`Failed to fetch loan data: ${error.message}`);

    return this.aggregateData(data || [], query.groupBy || ['status'], query.aggregation || 'sum');
  }

  /**
   * Get account analytics with balance trends
   */
  private async getAccountAnalytics(query: ReportQuery): Promise<AnalyticsData[]> {
    const supabaseClient = this.supabaseService.getClient();

    const { data, error } = await supabaseClient
      .from('accounts')
      .select('id, balance, currency, created_at, account_type')
      .eq('tenant_id', query.tenantId)
      .gte('created_at', query.startDate.toISOString())
      .lte('created_at', query.endDate.toISOString());

    if (error) throw new BadRequestException(`Failed to fetch account data: ${error.message}`);

    return this.aggregateData(data || [], query.groupBy || ['account_type'], query.aggregation || 'sum');
  }

  /**
   * Aggregate data by segments
   */
  private aggregateData(data: any[], groupByFields: string[], aggregation: string): AnalyticsData[] {
    const aggregated: Record<string, any> = {};

    data.forEach((record) => {
      const key = groupByFields.map((field) => record[field]).join('_');

      if (!aggregated[key]) {
        aggregated[key] = {
          segment: key,
          records: [],
          timestamp: new Date(record.created_at || record.updated_at || new Date()),
        };
      }

      aggregated[key].records.push(record);
    });

    return Object.values(aggregated).map((group) => ({
      timestamp: group.timestamp,
      segment: group.segment,
      value: this.performAggregation(group.records, aggregation),
    }));
  }

  /**
   * Perform aggregation on numeric values
   */
  private performAggregation(records: any[], aggregation: string): number {
    const values = records
      .map((r) => r.amount || r.balance || 1)
      .filter((v) => typeof v === 'number');

    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count':
        return records.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return records.length;
    }
  }

  /**
   * Export report to CSV format
   */
  exportToCSV(report: ReportResult): string {
    const headers = ['timestamp', 'segment', 'value'];
    const rows = report.data.map((item) => [
      item.timestamp.toISOString(),
      item.segment,
      item.value.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  }

  /**
   * Export report to JSON format
   */
  exportToJSON(report: ReportResult): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get time-series data for visualization
   */
  async getTimeSeriesData(
    query: ReportQuery,
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<AnalyticsData[]> {
    const baseReport = await this.generateReport(query);
    return this.groupByTimeInterval(baseReport.data, interval);
  }

  /**
   * Group data by time interval
   */
  private groupByTimeInterval(data: AnalyticsData[], interval: string): AnalyticsData[] {
    const grouped: Record<string, AnalyticsData> = {};

    data.forEach((item) => {
      const key = this.getTimeKey(item.timestamp, interval);

      if (!grouped[key]) {
        grouped[key] = {
          timestamp: this.getTimeStart(item.timestamp, interval),
          segment: item.segment,
          value: 0,
        };
      }

      grouped[key].value += item.value;
    });

    return Object.values(grouped).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get date key for grouping
   */
  private getTimeKey(date: Date, interval: string): string {
    const d = new Date(date);

    switch (interval) {
      case 'hourly':
        return d.toISOString().slice(0, 13);
      case 'daily':
        return d.toISOString().slice(0, 10);
      case 'weekly':
        return `${d.getFullYear()}-W${Math.ceil((d.getDate() - d.getDay() + 1) / 7)}`;
      case 'monthly':
        return d.toISOString().slice(0, 7);
      default:
        return d.toISOString().slice(0, 10);
    }
  }

  /**
   * Get start of time period
   */
  private getTimeStart(date: Date, interval: string): Date {
    const d = new Date(date);

    switch (interval) {
      case 'hourly':
        d.setMinutes(0, 0, 0);
        return d;
      case 'daily':
        d.setHours(0, 0, 0, 0);
        return d;
      case 'weekly':
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        return d;
      case 'monthly':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      default:
        return d;
    }
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate cache key for report query
   */
  private generateCacheKey(query: ReportQuery): string {
    return `analytics_${query.tenantId}_${query.type}_${query.startDate.getTime()}_${query.endDate.getTime()}`;
  }

  /**
   * Get cached data if valid
   */
  private getCache(key: string): any {
    const cached = this.cacheMap.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    this.cacheMap.delete(key);
    return null;
  }

  /**
   * Set cache with TTL
   */
  private setCache(key: string, data: any): void {
    this.cacheMap.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Clear cache for specific query or all
   */
  clearCache(queryType?: string): void {
    if (!queryType) {
      this.cacheMap.clear();
    } else {
      Array.from(this.cacheMap.keys()).forEach((key) => {
        if (key.includes(queryType)) {
          this.cacheMap.delete(key);
        }
      });
    }
  }
}
