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
export declare class AuditExportService {
    private supabase;
    constructor(supabase: SupabaseService);
    getAuditLogs(filters: AuditExportFilter): Promise<any[]>;
    private escapeCSV;
    exportToCSV(filters: AuditExportFilter): Promise<string>;
    exportToJSON(filters: AuditExportFilter): Promise<string>;
    exportToHTML(filters: AuditExportFilter): Promise<string>;
    getAuditStats(filters: AuditExportFilter): Promise<{
        totalActions: number;
        actionBreakdown: Record<string, number>;
        resourceTypeBreakdown: Record<string, number>;
        topUsers: Record<string, number>;
        dateRange: {
            earliest: any;
            latest: any;
        };
    }>;
}
