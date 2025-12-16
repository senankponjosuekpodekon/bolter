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
var AdminDashboardController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDashboardController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let AdminDashboardController = AdminDashboardController_1 = class AdminDashboardController {
    constructor(adminService) {
        this.adminService = adminService;
        this.logger = new common_1.Logger(AdminDashboardController_1.name);
    }
    async getDashboard() {
        this.logger.log('Fetching dashboard metrics');
        return this.adminService.getDashboardMetrics();
    }
    async getTransactionStats(period = '7d') {
        this.logger.log(`Fetching transaction stats for period: ${period}`);
        if (!['7d', '30d', '90d'].includes(period)) {
            period = '7d';
        }
        return this.adminService.getTransactionStats(period);
    }
    async getUserStats() {
        this.logger.log('Fetching user stats');
        return this.adminService.getUserStats();
    }
    async getKycStats() {
        this.logger.log('Fetching KYC stats');
        return this.adminService.getKycStats();
    }
    async getTimelineData(period = '7d') {
        this.logger.log(`Fetching timeline data for period: ${period}`);
        if (!['7d', '30d', '90d'].includes(period)) {
            period = '7d';
        }
        return this.adminService.getTimeSeriesData(period);
    }
};
exports.AdminDashboardController = AdminDashboardController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('stats/transactions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getTransactionStats", null);
__decorate([
    (0, common_1.Get)('stats/users'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('stats/kyc'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getKycStats", null);
__decorate([
    (0, common_1.Get)('stats/timeline'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getTimelineData", null);
exports.AdminDashboardController = AdminDashboardController = AdminDashboardController_1 = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminDashboardController);
//# sourceMappingURL=admin-dashboard.controller.js.map