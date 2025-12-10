import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditExportService, AuditExportFilter } from './audit-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Response } from 'express';

@ApiTags('admin/audit-export')
@Controller('admin/audit-export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AuditExportController {
  constructor(private readonly auditExportService: AuditExportService) { }

  @Get('csv')
  @HttpCode(200)
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  async exportCSV(@Query() filters: AuditExportFilter, @Res() res: Response) {
    const csv = await this.auditExportService.exportToCSV(filters);

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send(csv);
  }

  @Get('json')
  @HttpCode(200)
  @ApiOperation({ summary: 'Export audit logs as JSON' })
  async exportJSON(@Query() filters: AuditExportFilter, @Res() res: Response) {
    const json = await this.auditExportService.exportToJSON(filters);

    res.header('Content-Type', 'application/json');
    res.header(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`,
    );
    res.send(json);
  }

  @Get('pdf')
  @HttpCode(200)
  @ApiOperation({ summary: 'Export audit logs as PDF (HTML format)' })
  async exportPDF(@Query() filters: AuditExportFilter, @Res() res: Response) {
    const html = await this.auditExportService.exportToHTML(filters);

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.header(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.html"`,
    );
    res.send(html);
  }

  @Get('stats')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get audit log statistics' })
  async getStats(@Query() filters: AuditExportFilter) {
    return this.auditExportService.getAuditStats(filters);
  }

  @Get('logs')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get filtered audit logs' })
  async getLogs(@Query() filters: AuditExportFilter) {
    return this.auditExportService.getAuditLogs(filters);
  }
}
