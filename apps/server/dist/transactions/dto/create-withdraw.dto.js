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
exports.CreateWithdrawDto = exports.BankDetails = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class BankDetails {
}
exports.BankDetails = BankDetails;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IBAN' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BankDetails.prototype, "iban", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'BIC/SWIFT code', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BankDetails.prototype, "bic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account holder name' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BankDetails.prototype, "accountHolderName", void 0);
class CreateWithdrawDto {
}
exports.CreateWithdrawDto = CreateWithdrawDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account ID to withdraw from' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWithdrawDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Withdrawal amount', minimum: 0.01 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateWithdrawDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bank details for withdrawal', type: BankDetails }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", BankDetails)
], CreateWithdrawDto.prototype, "bankDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Description', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWithdrawDto.prototype, "description", void 0);
//# sourceMappingURL=create-withdraw.dto.js.map