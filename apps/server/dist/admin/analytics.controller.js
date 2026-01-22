"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AnalyticsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const analytics_exception_1 = require("./exceptions/analytics.exception");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let AnalyticsController = AnalyticsController_1 = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(AnalyticsController_1.name);
    }
    async generateReport(queryDto, req) {
        const tenantId = req.user?.tenant_id || req.user?.sub || 'default';
        try {
            this.logger.log(`[${tenantId}] Generating ${queryDto.type} report | Date: ${queryDto.startDate} to ${queryDto.endDate}`);
            if (!queryDto || !queryDto.type || !queryDto.startDate || !queryDto.endDate) {
                throw analytics_exception_1.AnalyticsException.validationError('Missing required fields in request body', {
                    required: ['type', 'startDate', 'endDate'],
                    received: Object.keys(queryDto || {}),
                });
            }
            const query = {
                type: queryDto.type,
                startDate: new Date(queryDto.startDate),
                endDate: new Date(queryDto.endDate),
                filters: queryDto.filters,
                groupBy: queryDto.groupBy,
                aggregation: queryDto.aggregation || 'count',
                tenantId,
            };
            const result = await this.analyticsService.generateReport(query);
            this.logger.log(`[${tenantId}] Report generated successfully | ID: ${result.id} | Records: ${result.summary.totalRecords}`);
            return result;
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException) {
                this.logger.warn(`[${tenantId}] Analytics validation error: ${error.message}`);
                throw error;
            }
            this.logger.error(`[${tenantId}] Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
            throw analytics_exception_1.AnalyticsException.internalError(error);
        }
    }
    async exportReport(request) {
        try {
            this.logger.log(`Exporting report ${request.reportId} as ${request.format}`);
            if (!request.reportId || !request.format || !request.data || request.data.length === 0) {
                throw analytics_exception_1.AnalyticsException.validationError('Invalid export request', {
                    required: ['reportId', 'format', 'data (non-empty)'],
                    received: {
                        reportId: !!request.reportId,
                        format: !!request.format,
                        dataCount: request.data?.length || 0,
                    },
                });
            }
            const validFormats = ['csv', 'json'];
            if (!validFormats.includes(request.format)) {
                throw analytics_exception_1.AnalyticsException.validationError('Invalid export format', {
                    received: request.format,
                    valid: validFormats,
                });
            }
            let content;
            let filename;
            let contentType;
            try {
                if (request.format === 'csv') {
                    content = this.convertToCsv(request.data, request.summary);
                    contentType = 'text/csv';
                    filename = `report-${request.reportId}-${Date.now()}.csv`;
                }
                else {
                    content = JSON.stringify({
                        reportId: request.reportId,
                        summary: request.summary,
                        data: request.data,
                        exportedAt: new Date().toISOString(),
                    }, null, 2);
                    contentType = 'application/json';
                    filename = `report-${request.reportId}-${Date.now()}.json`;
                }
            }
            catch (error) {
                this.logger.error(`Failed to format export data:`, error instanceof Error ? error.message : error);
                throw analytics_exception_1.AnalyticsException.exportError(request.format, 'Failed to format data');
            }
            try {
                const encodedContent = Buffer.from(content).toString('base64');
                const dataUrl = `data:${contentType};base64,${encodedContent}`;
                this.logger.log(`Report exported successfully | Format: ${request.format} | Size: ${content.length} bytes`);
                return {
                    url: dataUrl,
                    filename,
                    format: request.format,
                };
            }
            catch (error) {
                this.logger.error(`Failed to encode export data:`, error instanceof Error ? error.message : error);
                throw analytics_exception_1.AnalyticsException.exportError(request.format, 'Failed to encode data');
            }
        }
        catch (error) {
            if (error instanceof analytics_exception_1.AnalyticsException) {
                this.logger.warn(`Export validation error: ${error.message}`);
                throw error;
            }
            this.logger.error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
            throw analytics_exception_1.AnalyticsException.internalError(error);
        }
    }
    convertToCsv(data, summary) {
        const headers = ['Timestamp', 'Segment', 'Value', 'Trend'];
        const rows = data.map((item) => [
            item.timestamp,
            item.segment,
            item.value,
            item.trend || '',
        ]);
        const summaryRows = Object.entries(summary).map(([key, value]) => [
            key,
            value,
            '',
            '',
        ]);
        const allRows = [headers, ...rows, [], ['Summary'], ...summaryRows];
        return allRows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')).join('\n');
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('report'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Post)('export'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportReport", null);
exports.AnalyticsController = AnalyticsController = AnalyticsController_1 = __decorate([
    (0, common_1.Controller)('admin/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map