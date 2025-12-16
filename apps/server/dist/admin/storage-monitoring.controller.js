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
exports.StorageMonitoringController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const storage_monitoring_service_1 = require("../common/services/storage-monitoring.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let StorageMonitoringController = class StorageMonitoringController {
    constructor(storageMonitoring) {
        this.storageMonitoring = storageMonitoring;
    }
    async getMetrics() {
        return this.storageMonitoring.getAllStorageMetrics();
    }
    async getBucketStats(bucketName) {
        return this.storageMonitoring.getBucketStats(bucketName);
    }
    async getUserStorage(userId) {
        return this.storageMonitoring.getUserStorageStats(userId);
    }
    async checkQuotas() {
        return this.storageMonitoring.checkBucketQuotas();
    }
};
exports.StorageMonitoringController = StorageMonitoringController;
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all storage metrics (admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorageMonitoringController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('buckets/:bucketName'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bucket statistics (admin only)' }),
    __param(0, (0, common_1.Param)('bucketName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorageMonitoringController.prototype, "getBucketStats", null);
__decorate([
    (0, common_1.Get)('users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user storage usage (admin only)' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorageMonitoringController.prototype, "getUserStorage", null);
__decorate([
    (0, common_1.Get)('quota-check'),
    (0, swagger_1.ApiOperation)({ summary: 'Check bucket quotas and get alerts (admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorageMonitoringController.prototype, "checkQuotas", null);
exports.StorageMonitoringController = StorageMonitoringController = __decorate([
    (0, swagger_1.ApiTags)('admin/storage-monitoring'),
    (0, common_1.Controller)('admin/storage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [storage_monitoring_service_1.StorageMonitoringService])
], StorageMonitoringController);
//# sourceMappingURL=storage-monitoring.controller.js.map