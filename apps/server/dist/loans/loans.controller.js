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
exports.LoansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const loans_service_1 = require("./loans.service");
const create_loan_dto_1 = require("./dto/create-loan.dto");
const approve_loan_dto_1 = require("./dto/approve-loan.dto");
const reject_loan_dto_1 = require("./dto/reject-loan.dto");
const record_repayment_dto_1 = require("./dto/record-repayment.dto");
const query_loans_dto_1 = require("./dto/query-loans.dto");
let LoansController = class LoansController {
    constructor(loansService) {
        this.loansService = loansService;
    }
    createLoan(req, dto) {
        return this.loansService.createLoan(req.user.id, dto);
    }
    findLoans(req, query) {
        return this.loansService.findLoans(query, req.user);
    }
    findLoan(req, id) {
        return this.loansService.findLoanById(id, req.user);
    }
    getRepayments(req, id) {
        return this.loansService.getRepayments(id, req.user);
    }
    getLoanStatistics(req, id) {
        return this.loansService.getLoanStatistics(id, req.user);
    }
    recordRepayment(req, id, dto) {
        return this.loansService.recordRepayment(req.user.id, id, dto);
    }
    approveLoan(req, id, dto) {
        return this.loansService.approveLoan(req.user.id, id, dto);
    }
    rejectLoan(req, id, dto) {
        return this.loansService.rejectLoan(req.user.id, id, dto);
    }
};
exports.LoansController = LoansController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new loan request' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_loan_dto_1.CreateLoanDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "createLoan", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List loan requests for current user or admin scope' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_loans_dto_1.QueryLoansDto]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "findLoans", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single loan' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "findLoan", null);
__decorate([
    (0, common_1.Get)(':id/repayments'),
    (0, swagger_1.ApiOperation)({ summary: 'List repayments for a loan' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getRepayments", null);
__decorate([
    (0, common_1.Get)(':id/statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get loan statistics and repayment progress' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "getLoanStatistics", null);
__decorate([
    (0, common_1.Post)(':id/repayments'),
    (0, swagger_1.ApiOperation)({ summary: 'Record a loan repayment' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, record_repayment_dto_1.RecordRepaymentDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "recordRepayment", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a loan request (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approve_loan_dto_1.ApproveLoanDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "approveLoan", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a loan request (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reject_loan_dto_1.RejectLoanDto]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "rejectLoan", null);
exports.LoansController = LoansController = __decorate([
    (0, swagger_1.ApiTags)('loans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('loans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [loans_service_1.LoansService])
], LoansController);
//# sourceMappingURL=loans.controller.js.map