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
exports.CreateLoanDto = exports.LoanDocumentDto = exports.LoanDurationOption = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var LoanDurationOption;
(function (LoanDurationOption) {
    LoanDurationOption[LoanDurationOption["THREE_MONTHS"] = 3] = "THREE_MONTHS";
    LoanDurationOption[LoanDurationOption["SIX_MONTHS"] = 6] = "SIX_MONTHS";
    LoanDurationOption[LoanDurationOption["TWELVE_MONTHS"] = 12] = "TWELVE_MONTHS";
    LoanDurationOption[LoanDurationOption["EIGHTEEN_MONTHS"] = 18] = "EIGHTEEN_MONTHS";
    LoanDurationOption[LoanDurationOption["TWENTY_FOUR_MONTHS"] = 24] = "TWENTY_FOUR_MONTHS";
})(LoanDurationOption || (exports.LoanDurationOption = LoanDurationOption = {}));
class LoanDocumentDto {
}
exports.LoanDocumentDto = LoanDocumentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoanDocumentDto.prototype, "filename", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoanDocumentDto.prototype, "mimeType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], LoanDocumentDto.prototype, "size", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5_000_000),
    __metadata("design:type", String)
], LoanDocumentDto.prototype, "base64", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoanDocumentDto.prototype, "url", void 0);
class CreateLoanDto {
}
exports.CreateLoanDto = CreateLoanDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.Max)(1_000_000),
    __metadata("design:type", Number)
], CreateLoanDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(LoanDurationOption),
    __metadata("design:type", Number)
], CreateLoanDto.prototype, "durationMonths", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(280),
    __metadata("design:type", String)
], CreateLoanDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.Max)(5_000_000),
    __metadata("design:type", Number)
], CreateLoanDto.prototype, "monthlyIncome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], CreateLoanDto.prototype, "employer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], CreateLoanDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(0),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LoanDocumentDto),
    __metadata("design:type", Array)
], CreateLoanDto.prototype, "documents", void 0);
//# sourceMappingURL=create-loan.dto.js.map