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
exports.UpdateAccountDto = exports.ACCOUNT_STATUSES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const create_account_dto_1 = require("./create-account.dto");
exports.ACCOUNT_STATUSES = ['ACTIVE', 'FROZEN', 'CLOSED'];
class UpdateAccountDto {
}
exports.UpdateAccountDto = UpdateAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IBAN (French format)', required: false }),
    (0, class_transformer_1.Expose)({ name: 'account_number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^FR[0-9]{2}[0-9]{10}[A-Z0-9]{11}[0-9]{2}$/, {
        message: 'Invalid French IBAN format',
    }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: create_account_dto_1.ACCOUNT_TYPES, description: 'Account type' }),
    (0, class_transformer_1.Expose)({ name: 'account_type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(create_account_dto_1.ACCOUNT_TYPES, { message: 'Account type must be CHECKING or SAVINGS' }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "accountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.ACCOUNT_STATUSES, description: 'Account status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.ACCOUNT_STATUSES, { message: 'Status must be ACTIVE, FROZEN, or CLOSED' }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account balance (EUR)' }),
    (0, class_transformer_1.Expose)({ name: 'balance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : value;
    }),
    (0, class_validator_1.IsNumber)({ allowNaN: false, allowInfinity: false }, { message: 'Balance must be a numeric value' }),
    __metadata("design:type", Number)
], UpdateAccountDto.prototype, "balance", void 0);
//# sourceMappingURL=update-account.dto.js.map