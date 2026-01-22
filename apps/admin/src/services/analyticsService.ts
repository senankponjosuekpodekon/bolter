const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ReportQuery {
  type: 'transactions' | 'users' | 'kyc' | 'loans' | 'accounts';
  startDate: string;
  endDate: string;
  filters?: Record<string, unknown>;
  groupBy?: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface AnalyticsData {
  timestamp: string;
  segment: string;
  value: number;
  trend?: number;
  metadata?: Record<string, unknown>;
}

export interface ReportResult {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  data: AnalyticsData[];
  summary: {
    totalRecords: number;
    startDate: string;
    endDate: string;
    segments: number;
  };
}

class AnalyticsService {
  async generateReport(query: ReportQuery): Promise<ReportResult> {
    const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/analytics/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Analytics error:', response.status, errorBody);
      throw new Error(`Failed to generate report: ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  }

  async exportReport(
    report: ReportResult,
    format: 'csv' | 'json'
  ): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(
          `${API_URL}/admin/analytics/export`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportId: report.id,
          data: report.data,
          summary: report.summary,
          format,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export report: ${response.statusText}`);
    }

    return response.blob();
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new AnalyticsService();
