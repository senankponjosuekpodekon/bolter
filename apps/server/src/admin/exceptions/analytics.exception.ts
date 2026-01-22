import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Analytics-specific error codes for better error handling and debugging
 */
export enum AnalyticsErrorCode {
  // Validation errors
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_REPORT_TYPE = 'INVALID_REPORT_TYPE',
  INVALID_AGGREGATION = 'INVALID_AGGREGATION',
  MISSING_PARAMETERS = 'MISSING_PARAMETERS',

  // Database errors
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE',

  // Processing errors
  AGGREGATION_FAILED = 'AGGREGATION_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',

  // Resource errors
  REPORT_NOT_FOUND = 'REPORT_NOT_FOUND',
  CACHE_ERROR = 'CACHE_ERROR',

  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * Standardized error response structure
 */
export interface AnalyticsErrorResponse {
  code: AnalyticsErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Custom Analytics Exception
 * Provides standardized error handling with specific error codes
 */
export class AnalyticsException extends HttpException {
  public readonly code: AnalyticsErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: AnalyticsErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    const errorResponse: AnalyticsErrorResponse = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    super(errorResponse, statusCode);
    this.code = code;
    this.details = details;
  }

  /**
   * Create a validation error
   */
  static validationError(message: string, details?: Record<string, unknown>): AnalyticsException {
    return new AnalyticsException(
      AnalyticsErrorCode.MISSING_PARAMETERS,
      message,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }

  /**
   * Create an invalid date range error
   */
  static invalidDateRange(startDate: Date, endDate: Date): AnalyticsException {
    return new AnalyticsException(
      AnalyticsErrorCode.INVALID_DATE_RANGE,
      'Start date must be before end date',
      HttpStatus.BAD_REQUEST,
      { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    );
  }

  /**
   * Create an invalid report type error
   */
  static invalidReportType(type: string, validTypes: string[]): AnalyticsException {
    return new AnalyticsException(
      AnalyticsErrorCode.INVALID_REPORT_TYPE,
      `Invalid report type: ${type}`,
      HttpStatus.BAD_REQUEST,
      { providedType: type, validTypes },
    );
  }

  /**
   * Create a database error
   */
  static databaseError(message: string, tableName?: string): AnalyticsException {
    return new AnalyticsException(
      AnalyticsErrorCode.DATABASE_QUERY_FAILED,
      `Failed to fetch ${tableName || 'data'}: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      { tableName },
    );
  }

  /**
   * Create a no data available error
   */
  static noDataAvailable(reportType: string, dateRange: { start: Date; end: Date }): AnalyticsException {
    return new AnalyticsException(
      AnalyticsErrorCode.NO_DATA_AVAILABLE,
      `No data available for ${reportType} in the specified date range`,
      HttpStatus.OK, // Return 200 but indicate no data
      {
        reportType,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      },
    );
  }

  /**
   * Create an export error
   */
  static exportError(format: string, reason?: string): AnalyticsException {
    return new AnalyticsException(
      AnalyticsErrorCode.EXPORT_FAILED,
      `Failed to export report as ${format}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      { format },
    );
  }

  /**
   * Create an internal server error
   */
  static internalError(originalError: Error | unknown): AnalyticsException {
    const message = originalError instanceof Error ? originalError.message : 'An unexpected error occurred';
    return new AnalyticsException(
      AnalyticsErrorCode.INTERNAL_SERVER_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        originalError: originalError instanceof Error ? originalError.stack : String(originalError),
      },
    );
  }
}
