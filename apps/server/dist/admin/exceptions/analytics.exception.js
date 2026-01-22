"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsException = exports.AnalyticsErrorCode = void 0;
const common_1 = require("@nestjs/common");
var AnalyticsErrorCode;
(function (AnalyticsErrorCode) {
    AnalyticsErrorCode["INVALID_DATE_RANGE"] = "INVALID_DATE_RANGE";
    AnalyticsErrorCode["INVALID_REPORT_TYPE"] = "INVALID_REPORT_TYPE";
    AnalyticsErrorCode["INVALID_AGGREGATION"] = "INVALID_AGGREGATION";
    AnalyticsErrorCode["MISSING_PARAMETERS"] = "MISSING_PARAMETERS";
    AnalyticsErrorCode["DATABASE_QUERY_FAILED"] = "DATABASE_QUERY_FAILED";
    AnalyticsErrorCode["NO_DATA_AVAILABLE"] = "NO_DATA_AVAILABLE";
    AnalyticsErrorCode["AGGREGATION_FAILED"] = "AGGREGATION_FAILED";
    AnalyticsErrorCode["EXPORT_FAILED"] = "EXPORT_FAILED";
    AnalyticsErrorCode["REPORT_NOT_FOUND"] = "REPORT_NOT_FOUND";
    AnalyticsErrorCode["CACHE_ERROR"] = "CACHE_ERROR";
    AnalyticsErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
})(AnalyticsErrorCode || (exports.AnalyticsErrorCode = AnalyticsErrorCode = {}));
class AnalyticsException extends common_1.HttpException {
    constructor(code, message, statusCode = common_1.HttpStatus.BAD_REQUEST, details) {
        const errorResponse = {
            code,
            message,
            details,
            timestamp: new Date().toISOString(),
        };
        super(errorResponse, statusCode);
        this.code = code;
        this.details = details;
    }
    static validationError(message, details) {
        return new AnalyticsException(AnalyticsErrorCode.MISSING_PARAMETERS, message, common_1.HttpStatus.BAD_REQUEST, details);
    }
    static invalidDateRange(startDate, endDate) {
        return new AnalyticsException(AnalyticsErrorCode.INVALID_DATE_RANGE, 'Start date must be before end date', common_1.HttpStatus.BAD_REQUEST, { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
    }
    static invalidReportType(type, validTypes) {
        return new AnalyticsException(AnalyticsErrorCode.INVALID_REPORT_TYPE, `Invalid report type: ${type}`, common_1.HttpStatus.BAD_REQUEST, { providedType: type, validTypes });
    }
    static databaseError(message, tableName) {
        return new AnalyticsException(AnalyticsErrorCode.DATABASE_QUERY_FAILED, `Failed to fetch ${tableName || 'data'}: ${message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR, { tableName });
    }
    static noDataAvailable(reportType, dateRange) {
        return new AnalyticsException(AnalyticsErrorCode.NO_DATA_AVAILABLE, `No data available for ${reportType} in the specified date range`, common_1.HttpStatus.OK, {
            reportType,
            dateRange: {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
            },
        });
    }
    static exportError(format, reason) {
        return new AnalyticsException(AnalyticsErrorCode.EXPORT_FAILED, `Failed to export report as ${format}${reason ? `: ${reason}` : ''}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR, { format });
    }
    static internalError(originalError) {
        const message = originalError instanceof Error ? originalError.message : 'An unexpected error occurred';
        return new AnalyticsException(AnalyticsErrorCode.INTERNAL_SERVER_ERROR, message, common_1.HttpStatus.INTERNAL_SERVER_ERROR, {
            originalError: originalError instanceof Error ? originalError.stack : String(originalError),
        });
    }
}
exports.AnalyticsException = AnalyticsException;
//# sourceMappingURL=analytics.exception.js.map