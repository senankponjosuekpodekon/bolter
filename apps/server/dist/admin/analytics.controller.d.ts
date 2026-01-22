import { AnalyticsService, ReportResult } from './analytics.service';
import type { Request as ExpressRequest } from 'express';
interface AuthUser {
    tenant_id?: string;
    sub?: string;
    [key: string]: unknown;
}
interface AuthRequest extends ExpressRequest {
    user?: AuthUser;
}
export interface ReportQueryDto {
    type: 'transactions' | 'users' | 'kyc' | 'loans' | 'accounts';
    startDate: string | Date;
    endDate: string | Date;
    filters?: Record<string, unknown>;
    groupBy?: string[];
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}
export interface ExportRequestDto {
    reportId: string;
    format: 'csv' | 'json';
    data: Array<{
        timestamp: string;
        segment: string;
        value: number;
        trend?: number;
    }>;
    summary: Record<string, unknown>;
}
export declare class AnalyticsController {
    private analyticsService;
    private readonly logger;
    constructor(analyticsService: AnalyticsService);
    generateReport(queryDto: ReportQueryDto, req: AuthRequest): Promise<ReportResult>;
    exportReport(request: ExportRequestDto): Promise<{
        url: string;
        filename: string;
        format: string;
    }>;
    private convertToCsv;
}
export {};
