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
exports.PayTontineDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const tontines_types_1 = require("../tontines.types");
class PayTontineDto {
}
exports.PayTontineDto = PayTontineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Contribution amount to pay', example: 100 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], PayTontineDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment method', enum: tontines_types_1.PaymentMethod, example: 'BANK_TRANSFER' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(tontines_types_1.PaymentMethod),
    __metadata("design:type", String)
], PayTontineDto.prototype, "payment_method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment reference or transaction ID', example: 'TXN-12345', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayTontineDto.prototype, "payment_reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Proof of payment (file URL or description)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayTontineDto.prototype, "proof", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cycle ID for the payment', example: 'cycle-uuid' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayTontineDto.prototype, "cycle_id", void 0);
//# sourceMappingURL=pay-tontine.dto.js.map