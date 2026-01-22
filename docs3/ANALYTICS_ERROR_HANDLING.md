# Analytics Error Handling Implementation

Date: 22 Janvier 2026  
Status: ✅ COMPLETE

## Overview

Comprehensive error handling has been implemented across the analytics system with:
- Standardized error codes and responses
- User-friendly error messages
- Detailed logging and debugging
- Graceful error recovery
- Type-safe error handling

---

## Backend Error Handling

### 1. Custom Analytics Exception (`apps/server/src/admin/exceptions/analytics.exception.ts`)

**Error Codes Defined:**
```typescript
- INVALID_DATE_RANGE: Date validation errors
- INVALID_REPORT_TYPE: Unknown report type
- INVALID_AGGREGATION: Invalid aggregation method
- MISSING_PARAMETERS: Required fields missing
- DATABASE_QUERY_FAILED: Supabase/DB errors
- NO_DATA_AVAILABLE: No data in date range
- AGGREGATION_FAILED: Data aggregation errors
- EXPORT_FAILED: Export generation failed
- REPORT_NOT_FOUND: Report doesn't exist
- CACHE_ERROR: Cache operation failed
- INTERNAL_SERVER_ERROR: System errors
```

**Response Format:**
```json
{
  "code": "INVALID_DATE_RANGE",
  "message": "Start date must be before end date",
  "details": {
    "startDate": "2026-01-22T10:00:00Z",
    "endDate": "2026-01-20T10:00:00Z"
  },
  "timestamp": "2026-01-22T12:30:45.123Z"
}
```

**Helper Methods:**
- `AnalyticsException.validationError()` - Validation failures
- `AnalyticsException.invalidDateRange()` - Date range issues
- `AnalyticsException.invalidReportType()` - Unknown report types
- `AnalyticsException.databaseError()` - Database failures
- `AnalyticsException.noDataAvailable()` - Empty results
- `AnalyticsException.exportError()` - Export failures
- `AnalyticsException.internalError()` - System errors

---

### 2. Analytics Service (`apps/server/src/admin/analytics.service.ts`)

**Enhancements:**

1. **Query Validation**
   ```typescript
   validateReportQuery(query): void
   - Validates all required parameters
   - Checks date format and logic
   - Enforces max date range (2 years)
   - Validates aggregation types
   ```

2. **Try-Catch Error Wrapping**
   ```typescript
   async generateReport(query: ReportQuery): Promise<ReportResult>
   - Validates input before processing
   - Catches and logs database errors
   - Provides meaningful error messages
   - Handles edge cases (empty data, invalid types)
   ```

3. **Data Fetching with Error Handling**
   ```typescript
   private async getTransactionAnalytics(): Promise<AggregatedResult>
   - Returns empty result set on no data (non-fatal)
   - Throws AnalyticsException on errors
   - Logs all operations
   - Handles null/undefined safely
   ```

4. **Aggregation Error Handling**
   ```typescript
   private aggregateData(): AnalyticsData[]
   - Handles empty data gracefully
   - Safely extracts field values
   - Logs aggregation statistics
   - Returns empty array on failure
   ```

5. **Structured Logging**
   ```typescript
   private logger = new Logger(AnalyticsService.name);
   
   Log Levels:
   - logger.log() - Report generation success
   - logger.debug() - Cache hits, data statistics
   - logger.warn() - Empty data warnings
   - logger.error() - Failures with stack traces
   ```

---

### 3. Analytics Controller (`apps/server/src/admin/analytics.controller.ts`)

**Enhancements:**

1. **Request Validation**
   ```typescript
   @Post('report')
   async generateReport(queryDto: ReportQueryDto): Promise<ReportResult>
   - Validates DTO structure
   - Throws AnalyticsException on invalid input
   - Logs tenant and request details
   ```

2. **Error Response Mapping**
   ```typescript
   if (error instanceof AnalyticsException) {
     // Already formatted, re-throw
     throw error;
   } else {
     // Wrap unexpected errors
     throw AnalyticsException.internalError(error);
   }
   ```

3. **Structured Logging with Context**
   ```typescript
   [${tenantId}] Generating ${queryDto.type} report | Date: ${startDate} to ${endDate}
   [${tenantId}] Report generated successfully | ID: ${result.id} | Records: ${total}
   [${tenantId}] Analytics validation error: ${message}
   ```

4. **Export Validation**
   ```typescript
   @Post('export')
   async exportReport(request: ExportRequestDto)
   - Validates all required fields
   - Checks format is 'csv' or 'json'
   - Ensures data array is not empty
   - Wraps formatting errors
   ```

---

## Client Error Handling

### 1. Client Error Classes (`apps/client/src/services/analytics.errors.ts`)

**Error Codes:**
```typescript
- NETWORK_ERROR: Connection issues
- REQUEST_TIMEOUT: Request timeout (>30s)
- UNAUTHORIZED: 401 - Session expired
- FORBIDDEN: 403 - Permission denied
- SERVER_ERROR: 5xx - Server errors
- VALIDATION_ERROR: 4xx - Invalid data
- INVALID_PARAMETERS: Client-side validation
- NO_DATA: Empty result set
- PARSE_ERROR: Response parsing failed
- EXPORT_FAILED: Export operation failed
```

**Key Features:**
- `AnalyticsClientError.fromAxiosError()` - Parse HTTP errors
- `getDisplayMessage()` - User-friendly messages
- `toJSON()` - Serialization for logging
- Static helpers for common errors

---

### 2. Analytics Service (`apps/client/src/services/analytics.service.ts`)

**Enhancements:**

1. **Auth Token Management**
   ```typescript
   const getAuthToken = (): string
   - Throws AnalyticsClientError on missing token
   - Validates token structure
   - Clear error messages
   ```

2. **Report Generation**
   ```typescript
   async generateReport(query: ReportQuery): Promise<ReportResult>
   - Validates parameters before request
   - Checks response structure
   - Handles Axios errors gracefully
   - Logs all operations with context
   ```

3. **Export with Validation**
   ```typescript
   async exportReport(report: ReportResult, format: string): Promise<void>
   - Validates report existence
   - Checks format validity
   - Ensures data is not empty
   - Handles download failures
   ```

4. **Error Context Preservation**
   ```typescript
   catch (error) {
     if (error instanceof AnalyticsClientError) {
       throw error; // Already formatted
     }
     // Convert to AnalyticsClientError
     throw AnalyticsClientError.fromAxiosError(error);
   }
   ```

---

### 3. Analytics Panel Component (`apps/client/src/components/admin/AnalyticsPanel.tsx`)

**Enhancements:**

1. **Enhanced Error State**
   ```typescript
   interface ErrorState {
     message: string;
     type: "validation" | "network" | "server" | "auth" | "unknown";
     code?: ClientAnalyticsErrorCode;
     details?: Record<string, unknown>;
   }
   ```

2. **Centralized Error Handler**
   ```typescript
   const handleError = (err: unknown) => {
     // Maps error codes to UI types
     // Extracts display messages
     // Preserves error code for logging
   }
   ```

3. **Report Generation**
   ```typescript
   const handleGenerateReport = async () => {
     - Validates date range first
     - Uses service with error propagation
     - Handles empty results
     - Logs failures
   }
   ```

4. **Export Handling**
   ```typescript
   const handleExport = async (format: "csv" | "json") => {
     - Validates report exists
     - Catches export errors
     - Uses centralized error handler
   }
   ```

5. **Enhanced Error UI**
   - Color-coded by error type:
     - 🟡 Validation: Amber
     - 🟠 Network: Orange
     - 🟣 Auth: Purple
     - 🔴 Server: Red
   - Displays error code for debugging
   - Provides clear action items

---

## Error Handling Flow

### Report Generation Flow

```
1. Frontend: validateReportQuery()
   ↓ (validation errors thrown here)
2. Frontend: axios.post() with timeout
   ↓ (network errors caught)
3. Backend: DTO validation
   ↓ (validation exceptions thrown)
4. Backend: validateReportQuery()
   ↓ (comprehensive validation)
5. Backend: switch(reportType)
   ↓ (type checking + database)
6. Backend: getXxxAnalytics()
   ↓ (database error handling)
7. Backend: aggregateData()
   ↓ (aggregation error handling)
8. Frontend: handleError() maps to UI type
9. Frontend: Display formatted error message
```

### Export Flow

```
1. Frontend: Validate report data
   ↓
2. Frontend: axios.post() export request
   ↓
3. Backend: Validate ExportRequestDto
   ↓
4. Backend: Format to CSV/JSON
   ↓
5. Backend: Encode to base64
   ↓
6. Frontend: Download file
   ↓
7. Error: Caught and displayed to user
```

---

## Error Examples

### Example 1: Invalid Date Range

**Request:**
```json
{
  "type": "transactions",
  "startDate": "2026-01-22T00:00:00Z",
  "endDate": "2026-01-20T00:00:00Z",
  "aggregation": "sum"
}
```

**Backend Response (400):**
```json
{
  "code": "INVALID_DATE_RANGE",
  "message": "Start date must be before end date",
  "details": {
    "startDate": "2026-01-22T00:00:00.000Z",
    "endDate": "2026-01-20T00:00:00.000Z"
  },
  "timestamp": "2026-01-22T12:30:45.123Z"
}
```

**Frontend Display:**
- Type: validation (🟡 Amber)
- Title: "Validation Error"
- Message: "Start date must be before end date"
- Code: INVALID_DATE_RANGE

---

### Example 2: Network Timeout

**Request:** Times out after 30 seconds

**Frontend Catches:**
```typescript
if (error.code === 'ECONNABORTED') {
  throw new AnalyticsClientError(
    ClientAnalyticsErrorCode.REQUEST_TIMEOUT,
    'Request timeout. Please try again.'
  );
}
```

**Frontend Display:**
- Type: network (🟠 Orange)
- Title: "Connection Error"
- Message: "Request took too long. Please try again."

---

### Example 3: No Data Available

**Backend Returns:**
```json
{
  "id": "rpt_1704820000000_abc123",
  "name": "transactions Report - ...",
  "type": "transactions",
  "data": [],
  "summary": { "totalRecords": 0 }
}
```

**Frontend Handles:**
```typescript
if (result.data.length === 0) {
  setError({
    message: "No data available for the selected criteria",
    type: "unknown",
    code: ClientAnalyticsErrorCode.NO_DATA
  });
}
```

---

## Testing Error Scenarios

### Scenario 1: Unauthorized Access
```bash
# Test without valid token
curl -X POST http://localhost:3000/admin/analytics/report \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 UNAUTHORIZED
```

### Scenario 2: Invalid Date Range
```bash
# Test with startDate > endDate
curl -X POST http://localhost:3000/admin/analytics/report \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"type":"transactions","startDate":"2026-01-22","endDate":"2026-01-20"}'
# Expected: 400 INVALID_DATE_RANGE
```

### Scenario 3: No Data
```bash
# Test with future date range
curl -X POST http://localhost:3000/admin/analytics/report \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"type":"transactions","startDate":"2099-01-01","endDate":"2099-12-31"}'
# Expected: 200 OK with empty data array
```

### Scenario 4: Network Timeout
```bash
# Simulate timeout by delaying response >30s
# Frontend will automatically throw REQUEST_TIMEOUT error
```

---

## Logging & Monitoring

### Backend Logs Format
```
[Analytics] Generating report: type=transactions, dateRange=...
[Analytics] Cache hit for report: transactions
[Analytics] Report generated: id=rpt_xxx, records=150
[Analytics] No data found for report type transactions
[Analytics Error] Failed to fetch analytics for transactions: Connection timeout
[Analytics Warning] No transaction data found for the date range
```

### Frontend Logs Format
```
[Analytics] Generating report: type=transactions
[Analytics] Report generated: id=rpt_xxx, records=150
[Analytics] Exporting report as csv
[Analytics] File downloaded: report-transactions-2026-01-22.csv
[Analytics Warning] Report generation failed: VALIDATION_ERROR
[Analytics Error] Unexpected error during report generation
```

---

## Best Practices Implemented

1. **Error Stratification**
   - ✅ Validation errors first (client-side)
   - ✅ Authentication errors (401/403)
   - ✅ Business logic errors (400/422)
   - ✅ Server errors (5xx)

2. **Graceful Degradation**
   - ✅ Empty data returns as success (200 OK)
   - ✅ Warnings logged but don't crash
   - ✅ Fallback to generic messages

3. **User Communication**
   - ✅ Clear, actionable messages
   - ✅ Error codes for support
   - ✅ Color-coded by severity
   - ✅ No technical jargon

4. **Debugging Support**
   - ✅ Detailed logs with context
   - ✅ Error codes for tracking
   - ✅ Error details in responses
   - ✅ Stack traces in console

5. **Performance**
   - ✅ Request timeouts (30s)
   - ✅ Early validation prevents wasted processing
   - ✅ Cache errors don't block operations
   - ✅ Async error handling

---

## Files Modified

| File | Changes | Impact |
|------|---------|--------|
| `apps/server/src/admin/exceptions/analytics.exception.ts` | NEW | Standardized backend errors |
| `apps/server/src/admin/analytics.service.ts` | Enhanced | Validation + error handling |
| `apps/server/src/admin/analytics.controller.ts` | Enhanced | Request validation + logging |
| `apps/client/src/services/analytics.errors.ts` | NEW | Client-side error handling |
| `apps/client/src/services/analytics.service.ts` | Enhanced | Service error handling |
| `apps/client/src/components/admin/AnalyticsPanel.tsx` | Enhanced | UI error display |

---

## Summary

✅ **Error Handling Checklist:**
- [x] Backend exception class with error codes
- [x] Parameter validation on backend
- [x] Database error handling
- [x] Client error classes
- [x] Axios error mapping
- [x] Service error propagation
- [x] Component error handling
- [x] User-friendly error messages
- [x] Structured logging
- [x] Color-coded error UI
- [x] Error codes for debugging
- [x] Request timeout handling
- [x] Empty data handling

This implementation provides robust error handling across the entire analytics pipeline with clear communication to users and comprehensive logging for debugging.
