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
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_logs_service_1 = require("./audit-logs.service");
const query_audit_logs_dto_1 = require("./dto/query-audit-logs.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let AuditLogsController = class AuditLogsController {
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    findAll(query) {
        return this.auditLogsService.findAll(query);
    }
    findMine(req, query) {
        query.performedBy = req.user.id;
        return this.auditLogsService.findAll(query);
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs (Admin only)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_audit_logs_dto_1.QueryAuditLogsDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs performed by current admin' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_audit_logs_dto_1.QueryAuditLogsDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findMine", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, swagger_1.ApiTags)('audit-logs'),
    (0, common_1.Controller)('audit-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map