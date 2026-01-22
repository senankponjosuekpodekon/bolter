import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AnalyticsException } from './exceptions/analytics.exception';

export interface ReportQuery {
  type: 'transactions' | 'users' | 'kyc' | 'loans' | 'accounts' | 'tontines';
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

interface AggregatedResult {
  data: AnalyticsData[];
  rawCount: number;
}

@Injectable()
export class AnalyticsService {
  private readonly cacheMap = new Map<string, { data: ReportResult; expiresAt: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Generate custom analytics report based on query parameters
   */
  async generateReport(query: ReportQuery): Promise<ReportResult> {
    try {
      // Validate required parameters
      this.validateReportQuery(query);

      const cacheKey = this.generateCacheKey(query);
      const cached = this.getCache(cacheKey);
      
      if (cached) {
        this.logger.debug(`Cache hit for report: ${query.type}`);
        return cached;
      }

      this.logger.log(`Generating report: type=${query.type}, dateRange=${query.startDate.toISOString()} to ${query.endDate.toISOString()}`);

      let data: AnalyticsData[] = [];
      let rawCount = 0;

      try {
        switch (query.type) {
          case 'transactions':
            ({ data, rawCount } = await this.getTransactionAnalytics(query));
            break;
          case 'users':
            ({ data, rawCount } = await this.getUserAnalytics(query));
            break;
          case 'kyc':
            ({ data, rawCount } = await this.getKycAnalytics(query));
            break;
          case 'loans':
            ({ data, rawCount } = await this.getLoanAnalytics(query));
            break;
          case 'accounts':
            ({ data, rawCount } = await this.getAccountAnalytics(query));
            break;
          case 'tontines':
            ({ data, rawCount } = await this.getTontineAnalytics(query));
            break;
          default:
            throw AnalyticsException.invalidReportType(query.type, ['transactions', 'users', 'kyc', 'loans', 'accounts', 'tontines']);
        }
      } catch (error) {
        this.logger.error(`Failed to fetch analytics for ${query.type}:`, error instanceof Error ? error.message : error);
        if (error instanceof AnalyticsException) throw error;
        throw AnalyticsException.databaseError(
          error instanceof Error ? error.message : 'Unknown error',
          query.type,
        );
      }

      // Log warning if no data returned
      if (data.length === 0) {
        this.logger.warn(`No data found for report type ${query.type} in date range`);
      }

      const result: ReportResult = {
        id: this.generateReportId(),
        name: `${query.type} Report - ${new Date().toISOString()}`,
        type: query.type,
        generatedAt: new Date(),
        data,
        summary: {
          totalRecords: rawCount,
          startDate: query.startDate,
          endDate: query.endDate,
          segments: new Set(data.map((d) => d.segment)).size,
        },
      };

      this.setCache(cacheKey, result);
      this.logger.debug(`Report generated successfully: ${result.id}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Report generation failed:`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Validate report query parameters
   */
  private validateReportQuery(query: ReportQuery): void {
    if (!query.type || !query.startDate || !query.endDate || !query.tenantId) {
      throw AnalyticsException.validationError('Missing required report parameters', {
        required: ['type', 'startDate', 'endDate', 'tenantId'],
        provided: Object.keys(query),
      });
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw AnalyticsException.validationError('Invalid date format', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    if (startDate >= endDate) {
      throw AnalyticsException.invalidDateRange(startDate, endDate);
    }

    // Check for reasonable date range (max 2 years)
    const maxRange = 2 * 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      throw AnalyticsException.validationError('Date range is too large (max 2 years)', {
        maxRange: '2 years',
        requestedRange: Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
      });
    }

    // Validate aggregation type
    const validAggregations = ['sum', 'avg', 'count', 'min', 'max'];
    if (query.aggregation && !validAggregations.includes(query.aggregation)) {
      throw AnalyticsException.validationError('Invalid aggregation type', {
        provided: query.aggregation,
        valid: validAggregations,
      });
    }
  }

  /**
   * Get transaction analytics with aggregations
   */
  private async getTransactionAnalytics(query: ReportQuery): Promise<AggregatedResult> {
    try {
      const supabaseClient = this.supabaseService.getAdminClient();
      const { data, error } = await supabaseClient
        .from('transactions')
        .select('id, amount, status, created_at')
        .gte('created_at', query.startDate.toISOString())
        .lte('created_at', query.endDate.toISOString());

      if (error) {
        throw AnalyticsException.databaseError(error.message, 'transactions');
      }

      if (!data || data.length === 0) {
        this.logger.debug('No transaction data found for the date range');
        return { data: [], rawCount: 0 };
      }

      const aggregated = this.aggregateData(data, query.groupBy || ['status'], query.aggregation || 'sum');
      return { data: aggregated, rawCount: data.length };
    } catch (error) {
      if (error instanceof AnalyticsException) throw error;
      throw AnalyticsException.databaseError(
        error instanceof Error ? error.message : 'Unknown error',
        'transactions',
      );
    }
  }

  /**
   * Get user analytics with growth trends
   */
  private async getUserAnalytics(query: ReportQuery): Promise<AggregatedResult> {
    try {
      const supabaseClient = this.supabaseService.getAdminClient();
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, created_at, status')
        .gte('created_at', query.startDate.toISOString())
        .lte('created_at', query.endDate.toISOString());

      if (error) {
        throw AnalyticsException.databaseError(error.message, 'users');
      }

      if (!data || data.length === 0) {
        this.logger.debug('No user data found for the date range');
        return { data: [], rawCount: 0 };
      }

      const aggregated = this.aggregateData(data, query.groupBy || ['status'], 'count');
      return { data: aggregated, rawCount: data.length };
    } catch (error) {
      if (error instanceof AnalyticsException) throw error;
      throw AnalyticsException.databaseError(
        error instanceof Error ? error.message : 'Unknown error',
        'users',
      );
    }
  }

  /**
   * Get KYC analytics with approval rates
   */
  private async getKycAnalytics(query: ReportQuery): Promise<AggregatedResult> {
    try {
      const supabaseClient = this.supabaseService.getAdminClient();
      const { data, error } = await supabaseClient
        .from('kyc_documents')
        .select('id, status, created_at, document_type')
        .gte('created_at', query.startDate.toISOString())
        .lte('created_at', query.endDate.toISOString());

      if (error) {
        throw AnalyticsException.databaseError(error.message, 'kyc_documents');
      }

      if (!data || data.length === 0) {
        this.logger.debug('No KYC data found for the date range');
        return { data: [], rawCount: 0 };
      }

      const aggregated = this.aggregateData(data, query.groupBy || ['status'], 'count');
      return { data: aggregated, rawCount: data.length };
    } catch (error) {
      if (error instanceof AnalyticsException) throw error;
      throw AnalyticsException.databaseError(
        error instanceof Error ? error.message : 'Unknown error',
        'kyc_documents',
      );
    }
  }

  /**
   * Get loan analytics with disbursement trends
   */
  private async getLoanAnalytics(query: ReportQuery): Promise<AggregatedResult> {
    try {
      const supabaseClient = this.supabaseService.getAdminClient();
      const { data, error } = await supabaseClient
        .from('loans')
        .select('id, amount, status, created_at')
        .gte('created_at', query.startDate.toISOString())
        .lte('created_at', query.endDate.toISOString());

      if (error) {
        throw AnalyticsException.databaseError(error.message, 'loans');
      }

      if (!data || data.length === 0) {
        this.logger.debug('No loan data found for the date range');
        return { data: [], rawCount: 0 };
      }

      const aggregated = this.aggregateData(data, query.groupBy || ['status'], query.aggregation || 'sum');
      return { data: aggregated, rawCount: data.length };
    } catch (error) {
      if (error instanceof AnalyticsException) throw error;
      throw AnalyticsException.databaseError(
        error instanceof Error ? error.message : 'Unknown error',
        'loans',
      );
    }
  }

  /**
   * Get account analytics with balance trends
   */
  private async getAccountAnalytics(query: ReportQuery): Promise<AggregatedResult> {
    try {
      const supabaseClient = this.supabaseService.getAdminClient();
      const { data, error } = await supabaseClient
        .from('accounts')
        .select('id, balance, currency, created_at')
        .gte('created_at', query.startDate.toISOString())
        .lte('created_at', query.endDate.toISOString());

      if (error) {
        throw AnalyticsException.databaseError(error.message, 'accounts');
      }

      if (!data || data.length === 0) {
        this.logger.debug('No account data found for the date range');
        return { data: [], rawCount: 0 };
      }

      const aggregated = this.aggregateData(data, query.groupBy || ['account_type'], query.aggregation || 'sum');
      return { data: aggregated, rawCount: data.length };
    } catch (error) {
      if (error instanceof AnalyticsException) throw error;
      throw AnalyticsException.databaseError(
        error instanceof Error ? error.message : 'Unknown error',
        'accounts',
      );
    }
  }

  /**
   * Get tontine analytics with activity trends
   */
  private async getTontineAnalytics(query: ReportQuery): Promise<AggregatedResult> {
    try {
      const supabaseClient = this.supabaseService.getAdminClient();
      const { data, error } = await supabaseClient
        .from('tontines')
        .select('id, name, status, contribution_amount, total_cycles, current_cycle, created_at')
        .gte('created_at', query.startDate.toISOString())
        .lte('created_at', query.endDate.toISOString());

      if (error) {
        throw AnalyticsException.databaseError(error.message, 'tontines');
      }

      if (!data || data.length === 0) {
        this.logger.debug('No tontine data found for the date range');
        return { data: [], rawCount: 0 };
      }

      const aggregated = this.aggregateData(
        data,
        query.groupBy || ['status'],
        query.aggregation || 'count',
      );
      return { data: aggregated, rawCount: data.length };
    } catch (error) {
      if (error instanceof AnalyticsException) throw error;
      throw AnalyticsException.databaseError(
        error instanceof Error ? error.message : 'Unknown error',
        'tontines',
      );
    }
  }

  /**
   * Aggregate data by segments with error handling
   */
  private aggregateData(data: Record<string, unknown>[], groupByFields: string[], aggregation: string): AnalyticsData[] {
    if (!data || data.length === 0) {
      this.logger.debug('No data to aggregate');
      return [];
    }

    try {
      const aggregated: Record<string, { segment: string; records: Record<string, unknown>[]; timestamp: Date }> = {};

      data.forEach((record: Record<string, unknown>) => {
        const key = groupByFields
          .map((field) => {
            const value = record[field];
            return value !== null && value !== undefined ? String(value) : 'unknown';
          })
          .join('_');

        if (!aggregated[key]) {
          aggregated[key] = {
            segment: key,
            records: [],
            timestamp: new Date((record.created_at as string) || (record.updated_at as string) || new Date()),
          };
        }

        aggregated[key].records = [...aggregated[key].records, record];
      });

      const result = Object.values(aggregated).map((group) => ({
        timestamp: new Date(group.timestamp),
        segment: group.segment,
        value: this.performAggregation(group.records, aggregation),
      }));

      this.logger.debug(`Aggregated ${data.length} records into ${result.length} segments`);
      return result;
    } catch (error) {
      this.logger.error('Aggregation failed:', error instanceof Error ? error.message : error);
      throw AnalyticsException.internalError(error);
    }
  }

  /**
   * Perform aggregation on numeric values with error handling
   */
  private performAggregation(records: Record<string, unknown>[], aggregation: string): number {
    if (!records || records.length === 0) {
      return 0;
    }

    try {
      const values = records
        .map((r) => (r.amount as number) || (r.balance as number) || 1)
        .filter((v) => typeof v === 'number' && !isNaN(v));

      if (values.length === 0) {
        return 0;
      }

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
    } catch (error) {
      this.logger.error(`Aggregation error for type ${aggregation}:`, error instanceof Error ? error.message : error);
      return 0;
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
  private getCache(key: string): ReportResult | null {
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
  private setCache(key: string, data: ReportResult): void {
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
