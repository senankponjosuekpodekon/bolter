/**
 * Client-side error codes for analytics
 */
export enum ClientAnalyticsErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Client errors
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  NO_DATA = 'NO_DATA',
  PARSE_ERROR = 'PARSE_ERROR',
  
  // Export errors
  EXPORT_FAILED = 'EXPORT_FAILED',
}

/**
 * Standardized client error response
 */
export interface ClientAnalyticsError {
  code: ClientAnalyticsErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Custom Analytics Client Error
 */
export class AnalyticsClientError extends Error {
  public readonly code: ClientAnalyticsErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ClientAnalyticsErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AnalyticsClientError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, AnalyticsClientError.prototype);
  }

  /**
   * Create from axios error
   */
  static fromAxiosError(error: unknown): AnalyticsClientError {
    if (!error || typeof error !== 'object') {
      return new AnalyticsClientError(
        ClientAnalyticsErrorCode.SERVER_ERROR,
        'An unknown error occurred',
      );
    }

    const err = error as Record<string, unknown>;
    if (!err.response) {
      // Network error
      if (err.code === 'ECONNABORTED') {
        return new AnalyticsClientError(
          ClientAnalyticsErrorCode.REQUEST_TIMEOUT,
          'Request timeout. Please try again.',
          { originalError: String(err.message) },
        );
      }
      return new AnalyticsClientError(
        ClientAnalyticsErrorCode.NETWORK_ERROR,
        'Network error. Please check your connection.',
        { originalError: String(err.message) },
      );
    }

    const status = err.response as Record<string, unknown>;
    const statusCode = status?.status as number;
    const data = status?.data;

    // Server returned an error response
    if (statusCode === 401) {
      return new AnalyticsClientError(
        ClientAnalyticsErrorCode.UNAUTHORIZED,
        'Unauthorized. Please login again.',
        { status: statusCode },
      );
    }

    if (statusCode === 403) {
      return new AnalyticsClientError(
        ClientAnalyticsErrorCode.FORBIDDEN,
        'Access denied. Admin privileges required.',
        { status: statusCode },
      );
    }

    if (statusCode === 400 || statusCode === 422) {
      return new AnalyticsClientError(
        ClientAnalyticsErrorCode.VALIDATION_ERROR,
        String(data && typeof data === 'object' && 'message' in data ? (data as Record<string, unknown>).message : 'Invalid request parameters.'),
        { status: statusCode, serverResponse: data },
      );
    }

    if (statusCode && statusCode >= 500) {
      return new AnalyticsClientError(
        ClientAnalyticsErrorCode.SERVER_ERROR,
        String(data && typeof data === 'object' && 'message' in data ? (data as Record<string, unknown>).message : 'Server error. Please try again later.'),
        { status: statusCode, serverResponse: data },
      );
    }

    return new AnalyticsClientError(
      ClientAnalyticsErrorCode.SERVER_ERROR,
      String(data && typeof data === 'object' && 'message' in data ? (data as Record<string, unknown>).message : `Server error (${statusCode}). Please try again.`),
      { status: statusCode, serverResponse: data },
    );
  }

  /**
   * Create a network error
   */
  static networkError(message: string): AnalyticsClientError {
    return new AnalyticsClientError(
      ClientAnalyticsErrorCode.NETWORK_ERROR,
      message,
    );
  }

  /**
   * Create a validation error
   */
  static validationError(message: string, details?: Record<string, unknown>): AnalyticsClientError {
    return new AnalyticsClientError(
      ClientAnalyticsErrorCode.VALIDATION_ERROR,
      message,
      details,
    );
  }

  /**
   * Create a no data error
   */
  static noData(message: string): AnalyticsClientError {
    return new AnalyticsClientError(
      ClientAnalyticsErrorCode.NO_DATA,
      message,
    );
  }

  /**
   * Create a parse error
   */
  static parseError(message: string, originalError?: Error): AnalyticsClientError {
    return new AnalyticsClientError(
      ClientAnalyticsErrorCode.PARSE_ERROR,
      message,
      { originalError: originalError?.message },
    );
  }

  /**
   * Create an export error
   */
  static exportError(format: string, reason?: string): AnalyticsClientError {
    return new AnalyticsClientError(
      ClientAnalyticsErrorCode.EXPORT_FAILED,
      `Failed to export as ${format.toUpperCase()}${reason ? `: ${reason}` : ''}`,
      { format },
    );
  }

  /**
   * Get user-friendly message
   */
  getDisplayMessage(): string {
    const messages: Record<ClientAnalyticsErrorCode, string> = {
      [ClientAnalyticsErrorCode.NETWORK_ERROR]: 'Connection error. Please check your internet connection.',
      [ClientAnalyticsErrorCode.REQUEST_TIMEOUT]: 'Request took too long. Please try again.',
      [ClientAnalyticsErrorCode.UNAUTHORIZED]: 'Your session has expired. Please login again.',
      [ClientAnalyticsErrorCode.FORBIDDEN]: 'You do not have permission to access analytics.',
      [ClientAnalyticsErrorCode.SERVER_ERROR]: 'Server error. Please try again later.',
      [ClientAnalyticsErrorCode.VALIDATION_ERROR]: 'Invalid parameters. Please check your input.',
      [ClientAnalyticsErrorCode.INVALID_PARAMETERS]: 'Invalid parameters provided.',
      [ClientAnalyticsErrorCode.NO_DATA]: 'No data available for the selected criteria.',
      [ClientAnalyticsErrorCode.PARSE_ERROR]: 'Failed to process response data.',
      [ClientAnalyticsErrorCode.EXPORT_FAILED]: 'Failed to export report.',
    };

    return messages[this.code] || this.message;
  }

  /**
   * Serialize for logging
   */
  toJSON(): ClientAnalyticsError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}
