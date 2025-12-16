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
exports.CreateAccountDto = exports.CURRENCIES = exports.ACCOUNT_TYPES = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.ACCOUNT_TYPES = ['CHECKING', 'SAVINGS'];
exports.CURRENCIES = ['EUR', 'USD', 'GBP'];
class CreateAccountDto {
}
exports.CreateAccountDto = CreateAccountDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.ACCOUNT_TYPES, description: 'Account type to open', default: 'SAVINGS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.ACCOUNT_TYPES, { message: 'Account type must be CHECKING or SAVINGS' }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "accountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.CURRENCIES, description: 'Account currency', default: 'EUR' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.CURRENCIES, { message: 'Currency must be EUR, USD, or GBP' }),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account spending limit', default: 1000, minimum: 100, maximum: 100000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100, { message: 'Limit must be at least 100' }),
    (0, class_validator_1.Max)(100000, { message: 'Limit cannot exceed 100000' }),
    __metadata("design:type", Number)
], CreateAccountDto.prototype, "limit", void 0);
//# sourceMappingURL=create-account.dto.js.map