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
exports.CreateCardDto = exports.CARD_STATUSES = exports.CARD_TYPES = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.CARD_TYPES = ['VIRTUAL', 'PHYSICAL'];
exports.CARD_STATUSES = ['ACTIVE', 'BLOCKED', 'EXPIRED'];
class CreateCardDto {
}
exports.CreateCardDto = CreateCardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account ID to attach card to' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCardDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.CARD_TYPES, description: 'Card type', default: 'VIRTUAL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.CARD_TYPES, { message: 'Card type must be VIRTUAL or PHYSICAL' }),
    __metadata("design:type", String)
], CreateCardDto.prototype, "type", void 0);
//# sourceMappingURL=create-card.dto.js.map