import axios from "axios";
import { normalizeApiBase } from "../lib/url";
import { AnalyticsClientError } from "./analytics.errors";

const API_URL = normalizeApiBase(import.meta.env.VITE_API_URL);

/**
 * Get authentication token from Zustand store (persisted in localStorage)
 */
const getAuthToken = (): string => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) {
      throw AnalyticsClientError.validationError('No authentication token found');
    }
    
    const parsed = JSON.parse(authStorage);
    const token = parsed?.state?.accessToken;
    
    if (!token) {
      throw AnalyticsClientError.validationError('Invalid authentication token');
    }
    
    return token;
  } catch (error) {
    if (error instanceof AnalyticsClientError) throw error;
    throw AnalyticsClientError.parseError('Failed to parse authentication token', error as Error);
  }
};

export interface ReportQuery {
  type: "transactions" | "users" | "kyc" | "loans" | "accounts" | "tontines";
  startDate: string;
  endDate: string;
  aggregation: "count" | "sum" | "avg" | "min" | "max";
}

export interface AnalyticsData {
  segment: string;
  value: number;
  trend?: number;
  timestamp: string;
}

export interface ReportSummary {
  totalRecords: number;
  aggregationType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  [key: string]: unknown;
}

export interface ReportResult {
  id?: string;
  name?: string;
  type: string;
  data: AnalyticsData[];
  summary: ReportSummary;
  generatedAt: string;
}

/**
 * Type-specific column definitions for reports
 */
export const REPORT_COLUMNS: Record<string, { label: string; key: string; format?: (v: number) => string }[]> = {
  transactions: [
    { label: "Status", key: "segment" },
    { label: "Total Amount", key: "value", format: (v: number) => `$${v.toFixed(2)}` },
    { label: "Trend", key: "trend", format: (v: number) => `${v > 0 ? "+" : ""}${v}%` },
    { label: "Date", key: "timestamp" },
  ],
  users: [
    { label: "Status", key: "segment" },
    { label: "Count", key: "value", format: (v: number) => v.toLocaleString() },
    { label: "Trend", key: "trend", format: (v: number) => `${v > 0 ? "+" : ""}${v}%` },
    { label: "Date", key: "timestamp" },
  ],
  kyc: [
    { label: "Status", key: "segment" },
    { label: "Documents", key: "value", format: (v: number) => v.toLocaleString() },
    { label: "Trend", key: "trend", format: (v: number) => `${v > 0 ? "+" : ""}${v}%` },
    { label: "Date", key: "timestamp" },
  ],
  loans: [
    { label: "Status", key: "segment" },
    { label: "Total Amount", key: "value", format: (v: number) => `$${v.toFixed(2)}` },
    { label: "Trend", key: "trend", format: (v: number) => `${v > 0 ? "+" : ""}${v}%` },
    { label: "Date", key: "timestamp" },
  ],
  accounts: [
    { label: "Type", key: "segment" },
    { label: "Total Balance", key: "value", format: (v: number) => `$${v.toFixed(2)}` },
    { label: "Trend", key: "trend", format: (v: number) => `${v > 0 ? "+" : ""}${v}%` },
    { label: "Date", key: "timestamp" },
  ],
  tontines: [
    { label: "Status", key: "segment" },
    { label: "Count", key: "value", format: (v: number) => v.toLocaleString() },
    { label: "Trend", key: "trend", format: (v: number) => `${v > 0 ? "+" : ""}${v}%` },
    { label: "Date", key: "timestamp" },
  ],
};

class AnalyticsService {
  private readonly logger = {
    log: (message: string, data?: unknown) => {
      if (data) {
        console.log(`[Analytics] ${message}`, typeof data === 'object' ? JSON.stringify(data) : data);
      } else {
        console.log(`[Analytics] ${message}`);
      }
    },
    error: (message: string, error?: unknown) => {
      if (error) {
        console.error(`[Analytics Error] ${message}`, error);
      } else {
        console.error(`[Analytics Error] ${message}`);
      }
    },
    warn: (message: string, data?: unknown) => {
      if (data) {
        console.warn(`[Analytics Warning] ${message}`, typeof data === 'object' ? JSON.stringify(data) : data);
      } else {
        console.warn(`[Analytics Warning] ${message}`);
      }
    },
  };

  /**
   * Generate analytics report with comprehensive error handling
   */
  async generateReport(query: ReportQuery): Promise<ReportResult> {
    try {
      this.validateReportQuery(query);
      
      let token: string;
      try {
        token = getAuthToken();
      } catch (error) {
        if (error instanceof AnalyticsClientError) {
          throw error;
        }
        throw AnalyticsClientError.validationError('Authentication failed');
      }

      this.logger.log(`Generating report: type=${query.type}`);

      try {
        const response = await axios.post(
          `${API_URL}/admin/analytics/report`,
          query,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 30000, // 30 second timeout
          }
        );

        // Validate response structure
        if (!response.data || typeof response.data !== 'object') {
          throw AnalyticsClientError.parseError('Invalid response format from server');
        }

        const result: ReportResult = response.data;

        if (!result.data || !Array.isArray(result.data)) {
          throw AnalyticsClientError.parseError('Invalid report data structure');
        }

        this.logger.log(`Report generated: id=${result.id}, records=${result.data.length}`);
        return result;
      } catch (error) {
        if (error instanceof AnalyticsClientError) {
          throw error;
        }

        if (axios.isAxiosError(error)) {
          const clientError = AnalyticsClientError.fromAxiosError(error);
          
          // Check for known RLS recursion error
          if (error.response?.data?.message?.includes('infinite recursion')) {
            this.logger.warn('RLS infinite recursion detected - check FIX_RLS_INFINITE_RECURSION.md for solution');
          }
          
          throw clientError;
        }

        throw AnalyticsClientError.parseError('Failed to generate report', error as Error);
      }
    } catch (error) {
      if (error instanceof AnalyticsClientError) {
        this.logger.warn(`Report generation failed: ${error.code}`, error.toJSON());
        throw error;
      }

      this.logger.error('Unexpected error during report generation', error);
      throw AnalyticsClientError.parseError('Unexpected error', error as Error);
    }
  }

  /**
   * Validate report query parameters
   */
  private validateReportQuery(query: ReportQuery): void {
    if (!query.type || !query.startDate || !query.endDate) {
      throw AnalyticsClientError.validationError('Missing required fields', {
        required: ['type', 'startDate', 'endDate'],
        provided: Object.keys(query),
      });
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw AnalyticsClientError.validationError('Invalid date format');
    }

    if (startDate >= endDate) {
      throw AnalyticsClientError.validationError('Start date must be before end date');
    }

    const validTypes = ['transactions', 'users', 'kyc', 'loans', 'accounts', 'tontines'];
    if (!validTypes.includes(query.type)) {
      throw AnalyticsClientError.validationError(`Invalid report type: ${query.type}`, {
        valid: validTypes,
      });
    }

    const validAggregations = ['count', 'sum', 'avg', 'min', 'max'];
    if (query.aggregation && !validAggregations.includes(query.aggregation)) {
      throw AnalyticsClientError.validationError(`Invalid aggregation: ${query.aggregation}`, {
        valid: validAggregations,
      });
    }
  }

  /**
   * Export report to file with comprehensive error handling
   */
  async exportReport(
    report: ReportResult,
    format: "csv" | "json"
  ): Promise<void> {
    try {
      if (!report || !report.id) {
        throw AnalyticsClientError.validationError('Invalid report');
      }

      if (!['csv', 'json'].includes(format)) {
        throw AnalyticsClientError.validationError('Invalid export format', {
          provided: format,
          valid: ['csv', 'json'],
        });
      }

      if (!report.data || report.data.length === 0) {
        throw AnalyticsClientError.noData('No data to export');
      }

      let token: string;
      try {
        token = getAuthToken();
      } catch (error) {
        if (error instanceof AnalyticsClientError) {
          throw error;
        }
        throw AnalyticsClientError.validationError('Authentication failed');
      }

      this.logger.log(`Exporting report as ${format}`);

      try {
        // Format data for backend ExportRequestDto
        const exportData = {
          reportId: report.id,
          format,
          data: report.data.map((item) => ({
            timestamp: item.timestamp,
            segment: item.segment,
            value: item.value,
            trend: item.trend,
          })),
          summary: report.summary,
        };

        const response = await axios.post(
          `${API_URL}/admin/analytics/export`,
          exportData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        if (!response.data || !response.data.url || !response.data.filename) {
          throw AnalyticsClientError.exportError(format, 'Invalid server response');
        }

        const filename = `analytics-${report.type}-${
          new Date().toISOString().split("T")[0]
        }.${format}`;

        this.downloadBlob(response.data.url, filename);
        this.logger.log(`Export successful: ${filename}`);
      } catch (error) {
        if (error instanceof AnalyticsClientError) {
          throw error;
        }

        if (axios.isAxiosError(error)) {
          throw AnalyticsClientError.fromAxiosError(error);
        }

        throw AnalyticsClientError.exportError(format, (error as Error).message);
      }
    } catch (error) {
      if (error instanceof AnalyticsClientError) {
        this.logger.warn(`Export failed: ${error.code}`, error.toJSON());
        throw error;
      }

      this.logger.error('Unexpected error during export', error);
      throw AnalyticsClientError.exportError(format);
    }
  }

  /**
   * Download blob/data URL as file
   */
  private downloadBlob(dataUrl: string, filename: string): void {
    try {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.logger.log(`File downloaded: ${filename}`);
    } catch (error) {
      this.logger.error('Failed to download file', error);
      throw AnalyticsClientError.exportError('file', 'Download failed');
    }
  }
}

export default new AnalyticsService();
