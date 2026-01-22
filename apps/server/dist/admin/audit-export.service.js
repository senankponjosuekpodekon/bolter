"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditExportService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AuditExportService = class AuditExportService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getAuditLogs(filters) {
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
            const ordered = query.order('created_at', { ascending: false });
            let response;
            if (typeof ordered.range === 'function') {
                response = await ordered.range(0, 999);
            }
            if (response?.error) {
                throw response.error;
            }
            const hasData = Array.isArray(response?.data) && response.data.length > 0;
            if (!hasData && typeof ordered.limit === 'function') {
                response = await ordered.limit(1000);
            }
            const { data, error } = response || {};
            if (error || !data) {
                throw error || new Error('No data returned');
            }
            return data;
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to fetch audit logs: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
    escapeCSV(value) {
        if (value === null || value === undefined)
            return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
    async exportToCSV(filters) {
        const logs = await this.getAuditLogs(filters);
        const headers = [
            'ID',
            'User ID',
            'Action',
            'Resource Type',
            'Resource ID',
            'Timestamp',
            'Changes',
        ];
        const rows = logs.map((log) => [
            this.escapeCSV(log.id),
            this.escapeCSV(log.user_id),
            this.escapeCSV(log.action),
            this.escapeCSV(log.resource_type),
            this.escapeCSV(log.resource_id),
            this.escapeCSV(log.created_at),
            this.escapeCSV(JSON.stringify(log.changes || {})),
        ]);
        const csvLines = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ];
        if (rows.length === 0) {
            csvLines.push('');
        }
        return csvLines.join('\n');
    }
    async exportToJSON(filters) {
        const logs = await this.getAuditLogs(filters);
        return JSON.stringify({
            metadata: {
                exportedAt: new Date().toISOString(),
                filters,
                totalRecords: logs.length,
            },
            data: logs,
        });
    }
    async exportToHTML(filters) {
        const logs = await this.getAuditLogs(filters);
        if (logs.length === 0) {
            throw new common_1.BadRequestException('No audit logs found matching the specified filters');
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

    ${Object.keys(filters).some((k) => filters[k])
            ? `
    <div class="filters">
      <h3>Filters Applied:</h3>
      <p>
        ${Object.entries(filters)
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
            .map((log) => `
        <tr>
          <td>${new Date(log.created_at).toLocaleString()}</td>
          <td>${String(log.user_id).substring(0, 8)}...</td>
          <td>${log.action}</td>
          <td>${log.resource_type || '-'}</td>
          <td>${log.changes ? JSON.stringify(log.changes).substring(0, 50) + '...' : '-'}</td>
        </tr>
        `)
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
    async getAuditStats(filters) {
        try {
            const logs = await this.getAuditLogs(filters);
            const stats = {
                totalActions: logs.length,
                actionBreakdown: {},
                resourceTypeBreakdown: {},
                topUsers: {},
                dateRange: {
                    earliest: logs.length > 0 ? logs[logs.length - 1].created_at : null,
                    latest: logs.length > 0 ? logs[0].created_at : null,
                },
            };
            logs.forEach((log) => {
                const action = String(log.action);
                stats.actionBreakdown[action] =
                    (stats.actionBreakdown[action] || 0) + 1;
                if (log.resource_type) {
                    const resourceType = String(log.resource_type);
                    stats.resourceTypeBreakdown[resourceType] =
                        (stats.resourceTypeBreakdown[resourceType] || 0) + 1;
                }
                const userId = String(log.user_id);
                stats.topUsers[userId] = (stats.topUsers[userId] || 0) + 1;
            });
            return stats;
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to generate statistics: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
};
exports.AuditExportService = AuditExportService;
exports.AuditExportService = AuditExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuditExportService);
//# sourceMappingURL=audit-export.service.js.map