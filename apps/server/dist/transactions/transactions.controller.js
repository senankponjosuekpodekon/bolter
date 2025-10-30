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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transactions_service_1 = require("./transactions.service");
const create_transfer_dto_1 = require("./dto/create-transfer.dto");
const create_deposit_dto_1 = require("./dto/create-deposit.dto");
const create_withdraw_dto_1 = require("./dto/create-withdraw.dto");
const validate_transaction_dto_1 = require("./dto/validate-transaction.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const query_transactions_dto_1 = require("./dto/query-transactions.dto");
const admin_create_transaction_dto_1 = require("./dto/admin-create-transaction.dto");
let TransactionsController = class TransactionsController {
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    createTransfer(req, createTransferDto) {
        return this.transactionsService.createTransfer(req.user.id, createTransferDto);
    }
    createDeposit(req, createDepositDto) {
        return this.transactionsService.createDeposit(req.user.id, createDepositDto);
    }
    createWithdraw(req, createWithdrawDto) {
        return this.transactionsService.createWithdraw(req.user.id, createWithdrawDto);
    }
    getTransactions(req, query) {
        if (query.scope === 'admin') {
            this.ensureAdminRole(req.user?.role);
            return this.transactionsService.findAllForAdmin(query);
        }
        return this.transactionsService.findByUserId(req.user.id);
    }
    getPendingTransactions() {
        return this.transactionsService.findPending();
    }
    getPendingTransaction(id) {
        return this.transactionsService.findPendingById(id);
    }
    createAdminTransaction(req, dto) {
        return this.transactionsService.createAdminTransaction(req.user.id, dto);
    }
    validateTransaction(req, id, validateDto) {
        return this.transactionsService.validateTransaction(req.user.id, id, validateDto);
    }
    ensureAdminRole(role) {
        if (!['ADMIN', 'COMPLIANCE'].includes(role)) {
            throw new common_1.ForbiddenException('Admin privileges required');
        }
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)('transfer'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new transfer' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_transfer_dto_1.CreateTransferDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "createTransfer", null);
__decorate([
    (0, common_1.Post)('deposit'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a deposit (requires admin validation)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_deposit_dto_1.CreateDepositDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "createDeposit", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a withdrawal (requires admin validation)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_withdraw_dto_1.CreateWithdrawDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "createWithdraw", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user transactions or full ledger for admin' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_transactions_dto_1.QueryTransactionsDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending transactions (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getPendingTransactions", null);
__decorate([
    (0, common_1.Get)('pending/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending transaction by ID (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getPendingTransaction", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a transaction on behalf of clients (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_create_transaction_dto_1.AdminCreateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "createAdminTransaction", null);
__decorate([
    (0, common_1.Patch)(':id/validate'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate a transaction (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, validate_transaction_dto_1.ValidateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "validateTransaction", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)('transactions'),
    (0, common_1.Controller)('transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map