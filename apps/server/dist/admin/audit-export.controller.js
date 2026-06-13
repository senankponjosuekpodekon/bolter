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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_export_service_1 = require("./audit-export.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let AuditExportController = class AuditExportController {
    constructor(auditExportService) {
        this.auditExportService = auditExportService;
    }
    async exportCSV(filters, res) {
        const csv = await this.auditExportService.exportToCSV(filters);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    }
    async exportJSON(filters, res) {
        const json = await this.auditExportService.exportToJSON(filters);
        res.header('Content-Type', 'application/json');
        res.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
        res.send(json);
    }
    async exportPDF(filters, res) {
        const html = await this.auditExportService.exportToHTML(filters);
        res.header('Content-Type', 'text/html; charset=utf-8');
        res.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.html"`);
        res.send(html);
    }
    async getStats(filters) {
        return this.auditExportService.getAuditStats(filters);
    }
    async getLogs(filters) {
        return this.auditExportService.getAuditLogs(filters);
    }
};
exports.AuditExportController = AuditExportController;
__decorate([
    (0, common_1.Get)('csv'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Export audit logs as CSV' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditExportController.prototype, "exportCSV", null);
__decorate([
    (0, common_1.Get)('json'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Export audit logs as JSON' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditExportController.prototype, "exportJSON", null);
__decorate([
    (0, common_1.Get)('pdf'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Export audit logs as PDF (HTML format)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditExportController.prototype, "exportPDF", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit log statistics' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditExportController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Get filtered audit logs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditExportController.prototype, "getLogs", null);
exports.AuditExportController = AuditExportController = __decorate([
    (0, swagger_1.ApiTags)('admin/audit-export'),
    (0, common_1.Controller)('admin/audit-export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [audit_export_service_1.AuditExportService])
], AuditExportController);
//# sourceMappingURL=audit-export.controller.js.map