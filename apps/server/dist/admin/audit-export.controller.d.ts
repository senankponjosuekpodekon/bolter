import { AuditExportService, AuditExportFilter } from './audit-export.service';
import { Response } from 'express';
export declare class AuditExportController {
    private readonly auditExportService;
    constructor(auditExportService: AuditExportService);
    exportCSV(filters: AuditExportFilter, res: Response): Promise<void>;
    exportJSON(filters: AuditExportFilter, res: Response): Promise<void>;
    exportPDF(filters: AuditExportFilter, res: Response): Promise<void>;
    getStats(filters: AuditExportFilter): Promise<{
        totalActions: number;
        actionBreakdown: Record<string, number>;
        resourceTypeBreakdown: Record<string, number>;
        topUsers: Record<string, number>;
        dateRange: {
            earliest: unknown;
            latest: unknown;
        };
    }>;
    getLogs(filters: AuditExportFilter): Promise<Record<string, unknown>[]>;
}
