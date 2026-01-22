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
var AdminFilterController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFilterController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const kyc_filter_service_1 = require("../kyc/kyc-filter.service");
const transaction_filter_service_1 = require("../transactions/transaction-filter.service");
const kyc_filter_dto_1 = require("../kyc/dto/kyc-filter.dto");
const transaction_filter_dto_1 = require("../transactions/dto/transaction-filter.dto");
let AdminFilterController = AdminFilterController_1 = class AdminFilterController {
    constructor(kycFilterService, transactionFilterService) {
        this.kycFilterService = kycFilterService;
        this.transactionFilterService = transactionFilterService;
        this.logger = new common_1.Logger(AdminFilterController_1.name);
    }
    async filterKyc(query) {
        this.logger.log(`Filtering KYC documents with params:`, query);
        return this.kycFilterService.filter(query);
    }
    async filterTransactions(query) {
        this.logger.log(`Filtering transactions with params:`, query);
        return this.transactionFilterService.filter(query);
    }
};
exports.AdminFilterController = AdminFilterController;
__decorate([
    (0, common_1.Get)('kyc'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kyc_filter_dto_1.KycFilterDto]),
    __metadata("design:returntype", Promise)
], AdminFilterController.prototype, "filterKyc", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], AdminFilterController.prototype, "filterTransactions", null);
exports.AdminFilterController = AdminFilterController = AdminFilterController_1 = __decorate([
    (0, common_1.Controller)('admin/filter'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [kyc_filter_service_1.KycFilterService,
        transaction_filter_service_1.TransactionFilterService])
], AdminFilterController);
//# sourceMappingURL=admin-filter.controller.js.map