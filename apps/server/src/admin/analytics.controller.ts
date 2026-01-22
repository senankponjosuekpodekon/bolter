import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
} from '@nestjs/common';
import { AnalyticsService, ReportQuery, ReportResult } from './analytics.service';
import { AnalyticsException } from './exceptions/analytics.exception';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
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

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private analyticsService: AnalyticsService) {}

  /**
   * Generate custom analytics report
   * POST /admin/analytics/report
   */
  @Post('report')
  @HttpCode(HttpStatus.OK)
  async generateReport(
    @Body() queryDto: ReportQueryDto,
    @Request() req: AuthRequest,
  ): Promise<ReportResult> {
    const tenantId = req.user?.tenant_id || req.user?.sub || 'default';
    
    try {
      this.logger.log(
        `[${tenantId}] Generating ${queryDto.type} report | Date: ${queryDto.startDate} to ${queryDto.endDate}`,
      );

      // Validate DTO
      if (!queryDto || !queryDto.type || !queryDto.startDate || !queryDto.endDate) {
        throw AnalyticsException.validationError('Missing required fields in request body', {
          required: ['type', 'startDate', 'endDate'],
          received: Object.keys(queryDto || {}),
        });
      }

      const query: ReportQuery = {
        type: queryDto.type,
        startDate: new Date(queryDto.startDate),
        endDate: new Date(queryDto.endDate),
        filters: queryDto.filters,
        groupBy: queryDto.groupBy,
        aggregation: queryDto.aggregation || 'count',
        tenantId,
      };

      const result = await this.analyticsService.generateReport(query);

      this.logger.log(
        `[${tenantId}] Report generated successfully | ID: ${result.id} | Records: ${result.summary.totalRecords}`,
      );

      return result;
    } catch (error) {
      if (error instanceof AnalyticsException) {
        this.logger.warn(
          `[${tenantId}] Analytics validation error: ${error.message}`,
        );
        throw error;
      }

      this.logger.error(
        `[${tenantId}] Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw AnalyticsException.internalError(error);
    }
  }

  /**
   * Export analytics report as CSV or JSON
   * POST /admin/analytics/export
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportReport(
    @Body() request: ExportRequestDto,
  ): Promise<{ url: string; filename: string; format: string }> {
    try {
      this.logger.log(`Exporting report ${request.reportId} as ${request.format}`);

      // Validate export request
      if (!request.reportId || !request.format || !request.data || request.data.length === 0) {
        throw AnalyticsException.validationError('Invalid export request', {
          required: ['reportId', 'format', 'data (non-empty)'],
          received: {
            reportId: !!request.reportId,
            format: !!request.format,
            dataCount: request.data?.length || 0,
          },
        });
      }

      // Validate format
      const validFormats = ['csv', 'json'];
      if (!validFormats.includes(request.format)) {
        throw AnalyticsException.validationError('Invalid export format', {
          received: request.format,
          valid: validFormats,
        });
      }

      let content: string;
      let filename: string;
      let contentType: string;

      try {
        if (request.format === 'csv') {
          content = this.convertToCsv(request.data, request.summary);
          contentType = 'text/csv';
          filename = `report-${request.reportId}-${Date.now()}.csv`;
        } else {
          content = JSON.stringify(
            {
              reportId: request.reportId,
              summary: request.summary,
              data: request.data,
              exportedAt: new Date().toISOString(),
            },
            null,
            2,
          );
          contentType = 'application/json';
          filename = `report-${request.reportId}-${Date.now()}.json`;
        }
      } catch (error) {
        this.logger.error(`Failed to format export data:`, error instanceof Error ? error.message : error);
        throw AnalyticsException.exportError(request.format, 'Failed to format data');
      }

      try {
        // In a production environment, you would:
        // 1. Save the file to cloud storage (S3, GCS, etc.)
        // 2. Return a pre-signed URL
        // For now, we return base64 encoded data
        const encodedContent = Buffer.from(content).toString('base64');
        const dataUrl = `data:${contentType};base64,${encodedContent}`;

        this.logger.log(`Report exported successfully | Format: ${request.format} | Size: ${content.length} bytes`);

        return {
          url: dataUrl,
          filename,
          format: request.format,
        };
      } catch (error) {
        this.logger.error(`Failed to encode export data:`, error instanceof Error ? error.message : error);
        throw AnalyticsException.exportError(request.format, 'Failed to encode data');
      }
    } catch (error) {
      if (error instanceof AnalyticsException) {
        this.logger.warn(`Export validation error: ${error.message}`);
        throw error;
      }

      this.logger.error(
        `Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw AnalyticsException.internalError(error);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCsv(
    data: Array<{
      timestamp: string;
      segment: string;
      value: number;
      trend?: number;
    }>,
    summary: Record<string, unknown>,
  ): string {
    const headers = ['Timestamp', 'Segment', 'Value', 'Trend'];
    const rows = data.map((item) => [
      item.timestamp,
      item.segment,
      item.value,
      item.trend || '',
    ]);

    // Add summary section
    const summaryRows = Object.entries(summary).map(([key, value]) => [
      key,
      value,
      '',
      '',
    ]);

    const allRows = [headers, ...rows, [], ['Summary'], ...summaryRows];

    return allRows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')).join('\n');
  }
}
