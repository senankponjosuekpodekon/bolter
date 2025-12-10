import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface AuditExportFilter {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  format?: 'csv' | 'pdf' | 'json';
}

@Injectable()
export class AuditExportService {
  constructor(private supabase: SupabaseService) { }

  /**
   * Fetch audit logs based on filters
   */
  async getAuditLogs(filters: AuditExportFilter) {
    try {
      let query = this.supabase
        .getAdminClient()
        .from('activity_logs')
        .select('*');

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.action) {
        query = query.like('action', `%${filters.action}%`);
      }

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new BadRequestException(
        `Failed to fetch audit logs: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Helper to convert value to CSV-safe string
   */
  private escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Export audit logs to CSV format
   */
  async exportToCSV(filters: AuditExportFilter): Promise<string> {
    const logs = await this.getAuditLogs(filters);

    if (logs.length === 0) {
      throw new BadRequestException('No audit logs found matching the specified filters');
    }

    try {
      const headers = [
        'ID',
        'User ID',
        'Action',
        'Resource Type',
        'Resource ID',
        'Changes',
        'IP Address',
        'User Agent',
        'Created At',
      ];

      const rows = logs.map((log) => [
        this.escapeCSV(log.id),
        this.escapeCSV(log.user_id),
        this.escapeCSV(log.action),
        this.escapeCSV(log.resource_type),
        this.escapeCSV(log.resource_id),
        this.escapeCSV(JSON.stringify(log.changes || {})),
        this.escapeCSV(log.ip_address),
        this.escapeCSV(log.user_agent),
        this.escapeCSV(log.created_at),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      return csv;
    } catch (err) {
      throw new BadRequestException(
        `Failed to generate CSV: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Export audit logs to JSON format
   */
  async exportToJSON(filters: AuditExportFilter): Promise<string> {
    const logs = await this.getAuditLogs(filters);

    if (logs.length === 0) {
      throw new BadRequestException('No audit logs found matching the specified filters');
    }

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        filters,
        totalRecords: logs.length,
        data: logs,
      },
      null,
      2,
    );
  }

  /**
   * Export audit logs to HTML table format (simulating PDF as text/html)
   */
  async exportToHTML(filters: AuditExportFilter): Promise<string> {
    const logs = await this.getAuditLogs(filters);

    if (logs.length === 0) {
      throw new BadRequestException('No audit logs found matching the specified filters');
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Audit Log Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { text-align: center; margin-bottom: 10px; color: #333; }
    .metadata { text-align: center; color: #666; font-size: 12px; margin-bottom: 30px; }
    .filters { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 30px; }
    .filters h3 { color: #333; font-size: 14px; margin-bottom: 10px; }
    .filters p { color: #666; font-size: 12px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #2196f3; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f5f5f5; }
    .page-break { page-break-after: always; }
    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 10px; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Audit Log Export</h1>
    <div class="metadata">
      <p>Exported: ${new Date().toISOString()}</p>
      <p>Total Records: ${logs.length}</p>
    </div>

    ${Object.keys(filters).some((k) => filters[k as keyof AuditExportFilter])
        ? `
    <div class="filters">
      <h3>Filters Applied:</h3>
      <p>
        ${Object.entries(filters)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_k, v]) => v)
          .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
          .join('<br>')}
      </p>
    </div>
    `
        : ''}

    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>User</th>
          <th>Action</th>
          <th>Resource</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${logs
        .map(
          (log) => `
        <tr>
          <td>${new Date(log.created_at).toLocaleString()}</td>
          <td>${log.user_id.substring(0, 8)}...</td>
          <td>${log.action}</td>
          <td>${log.resource_type || '-'}</td>
          <td>${log.changes ? JSON.stringify(log.changes).substring(0, 50) + '...' : '-'
            }</td>
        </tr>
        `,
        )
        .join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>This document was automatically generated. For security, keep it confidential.</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStats(filters: AuditExportFilter) {
    try {
      const logs = await this.getAuditLogs(filters);

      const stats = {
        totalActions: logs.length,
        actionBreakdown: {} as Record<string, number>,
        resourceTypeBreakdown: {} as Record<string, number>,
        topUsers: {} as Record<string, number>,
        dateRange: {
          earliest: logs.length > 0 ? logs[logs.length - 1].created_at : null,
          latest: logs.length > 0 ? logs[0].created_at : null,
        },
      };

      logs.forEach((log) => {
        // Action breakdown
        stats.actionBreakdown[log.action] =
          (stats.actionBreakdown[log.action] || 0) + 1;

        // Resource type breakdown
        if (log.resource_type) {
          stats.resourceTypeBreakdown[log.resource_type] =
            (stats.resourceTypeBreakdown[log.resource_type] || 0) + 1;
        }

        // Top users
        stats.topUsers[log.user_id] = (stats.topUsers[log.user_id] || 0) + 1;
      });

      return stats;
    } catch (err) {
      throw new BadRequestException(
        `Failed to generate statistics: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
