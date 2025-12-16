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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCreateTransactionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const create_deposit_dto_1 = require("./create-deposit.dto");
const create_withdraw_dto_1 = require("./create-withdraw.dto");
class AdminCreateTransactionDto {
    constructor() {
        this.autoApprove = true;
    }
}
exports.AdminCreateTransactionDto = AdminCreateTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL'] }),
    (0, class_validator_1.IsEnum)(['TRANSFER', 'DEPOSIT', 'WITHDRAWAL']),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount of the transaction', minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], AdminCreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency code (defaults to EUR)', default: 'EUR' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description to attach to the transaction' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Automatically approve the transaction when created', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdminCreateTransactionDto.prototype, "autoApprove", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account ID debited for transfers/withdrawals' }),
    (0, class_validator_1.ValidateIf)((value) => value.type === 'TRANSFER' || value.type === 'WITHDRAWAL'),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "fromAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account ID credited for deposits/transfers' }),
    (0, class_validator_1.ValidateIf)((value) => value.type === 'TRANSFER' || value.type === 'DEPOSIT'),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "toAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'External IBAN for transfers/withdrawals' }),
    (0, class_validator_1.ValidateIf)((value) => value.type === 'TRANSFER' || value.type === 'WITHDRAWAL'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "ibanExternal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Payment method for deposits', enum: create_deposit_dto_1.PaymentMethod }),
    (0, class_validator_1.ValidateIf)((value) => value.type === 'DEPOSIT'),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(create_deposit_dto_1.PaymentMethod),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Payment reference for deposits' }),
    (0, class_validator_1.ValidateIf)((value) => value.type === 'DEPOSIT'),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCreateTransactionDto.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bank details for withdrawals', type: create_withdraw_dto_1.BankDetails }),
    (0, class_validator_1.ValidateIf)((value) => value.type === 'WITHDRAWAL'),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", create_withdraw_dto_1.BankDetails)
], AdminCreateTransactionDto.prototype, "bankDetails", void 0);
//# sourceMappingURL=admin-create-transaction.dto.js.map