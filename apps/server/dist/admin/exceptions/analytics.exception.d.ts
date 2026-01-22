import { HttpException, HttpStatus } from '@nestjs/common';
export declare enum AnalyticsErrorCode {
    INVALID_DATE_RANGE = "INVALID_DATE_RANGE",
    INVALID_REPORT_TYPE = "INVALID_REPORT_TYPE",
    INVALID_AGGREGATION = "INVALID_AGGREGATION",
    MISSING_PARAMETERS = "MISSING_PARAMETERS",
    DATABASE_QUERY_FAILED = "DATABASE_QUERY_FAILED",
    NO_DATA_AVAILABLE = "NO_DATA_AVAILABLE",
    AGGREGATION_FAILED = "AGGREGATION_FAILED",
    EXPORT_FAILED = "EXPORT_FAILED",
    REPORT_NOT_FOUND = "REPORT_NOT_FOUND",
    CACHE_ERROR = "CACHE_ERROR",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
}
export interface AnalyticsErrorResponse {
    code: AnalyticsErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
}
export declare class AnalyticsException extends HttpException {
    readonly code: AnalyticsErrorCode;
    readonly details?: Record<string, unknown>;
    constructor(code: AnalyticsErrorCode, message: string, statusCode?: HttpStatus, details?: Record<string, unknown>);
    static validationError(message: string, details?: Record<string, unknown>): AnalyticsException;
    static invalidDateRange(startDate: Date, endDate: Date): AnalyticsException;
    static invalidReportType(type: string, validTypes: string[]): AnalyticsException;
    static databaseError(message: string, tableName?: string): AnalyticsException;
    static noDataAvailable(reportType: string, dateRange: {
        start: Date;
        end: Date;
    }): AnalyticsException;
    static exportError(format: string, reason?: string): AnalyticsException;
    static internalError(originalError: Error | unknown): AnalyticsException;
}
