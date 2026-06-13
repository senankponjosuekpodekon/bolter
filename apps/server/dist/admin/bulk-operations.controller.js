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
exports.BulkOperationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bulk_operations_service_1 = require("./bulk-operations.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let BulkOperationsController = class BulkOperationsController {
    constructor(bulkOperationsService) {
        this.bulkOperationsService = bulkOperationsService;
    }
    async bulkReviewKYC(req, payload) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkReviewKYCDocuments(userId, payload);
    }
    async bulkReviewTransactions(req, payload) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkReviewTransactions(userId, payload);
    }
    async bulkFlagKYC(req, payload) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkFlagItems(userId, 'kyc_documents', payload);
    }
    async bulkFlagTransactions(req, payload) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkFlagItems(userId, 'transactions', payload);
    }
    async bulkDeleteKYC(req, payload) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkDeleteItems(userId, 'kyc_documents', payload);
    }
    async bulkDeleteTransactions(req, payload) {
        const userId = req.user?.id ?? 'unknown';
        return this.bulkOperationsService.bulkDeleteItems(userId, 'transactions', payload);
    }
    async getStats() {
        return this.bulkOperationsService.getBulkOperationStats();
    }
};
exports.BulkOperationsController = BulkOperationsController;
__decorate([
    (0, common_1.Post)('kyc/review'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk review KYC documents (approve/reject)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BulkOperationsController.prototype, "bulkReviewKYC", null);
__decorate([
    (0, common_1.Post)('transactions/review'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk review transactions (approve/reject)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BulkOperationsController.prototype, "bulkReviewTransactions", null);
__decorate([
    (0, common_1.Post)('kyc/flag'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk flag KYC documents for manual review' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BulkOperationsController.prototype, "bulkFlagKYC", null);
__decorate([
    (0, common_1.Post)('transactions/flag'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk flag transactions for manual review' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BulkOperationsController.prototype, "bulkFlagTransactions", null);
__decorate([
    (0, common_1.Post)('kyc/delete'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk soft-delete KYC documents' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BulkOperationsController.prototype, "bulkDeleteKYC", null);
__decorate([
    (0, common_1.Post)('transactions/delete'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk soft-delete transactions' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BulkOperationsController.prototype, "bulkDeleteTransactions", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bulk operation statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BulkOperationsController.prototype, "getStats", null);
exports.BulkOperationsController = BulkOperationsController = __decorate([
    (0, swagger_1.ApiTags)('admin/bulk-operations'),
    (0, common_1.Controller)('admin/bulk-operations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [bulk_operations_service_1.BulkOperationsService])
], BulkOperationsController);
//# sourceMappingURL=bulk-operations.controller.js.map