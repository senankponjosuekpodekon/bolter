import { API_BASE_URL } from '../config/api.config';

export interface AuditExportFilter {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  format?: 'csv' | 'pdf' | 'json';
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditStats {
  totalLogs: number;
  actionCounts: Record<string, number>;
  resourceTypeCounts: Record<string, number>;
  dateRange: { from: string; to: string };
}

class AuditExportService {
  /**
   * Get filtered audit logs
   */
  async getAuditLogs(filters: AuditExportFilter): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.resourceId) params.append('resourceId', filters.resourceId);

    const response = await fetch(
      `${API_BASE_URL}/admin/audit-export/logs?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    return response.json();
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(filters: AuditExportFilter): Promise<AuditStats> {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.resourceId) params.append('resourceId', filters.resourceId);

    const response = await fetch(
      `${API_BASE_URL}/admin/audit-export/stats?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch audit statistics');
    }

    return response.json();
  }

  /**
   * Export audit logs as CSV
   */
  async exportAsCSV(filters: AuditExportFilter): Promise<void> {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.resourceId) params.append('resourceId', filters.resourceId);

    const response = await fetch(
      `${API_BASE_URL}/admin/audit-export/csv?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    const blob = await response.blob();
    this.downloadFile(blob, 'audit-logs.csv', 'text/csv');
  }

  /**
   * Export audit logs as JSON
   */
  async exportAsJSON(filters: AuditExportFilter): Promise<void> {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.resourceId) params.append('resourceId', filters.resourceId);

    const response = await fetch(
      `${API_BASE_URL}/admin/audit-export/json?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export JSON');
    }

    const blob = await response.blob();
    this.downloadFile(blob, 'audit-logs.json', 'application/json');
  }

  /**
   * Export audit logs as HTML/PDF
   */
  async exportAsHTML(filters: AuditExportFilter): Promise<void> {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.resourceId) params.append('resourceId', filters.resourceId);

    const response = await fetch(
      `${API_BASE_URL}/admin/audit-export/pdf?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    const blob = await response.blob();
    this.downloadFile(blob, 'audit-logs.html', 'text/html');
  }

  /**
   * Helper to download file
   */
  private downloadFile(blob: Blob, filename: string, type: string): void {
    const url = window.URL.createObjectURL(new Blob([blob], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new AuditExportService();
