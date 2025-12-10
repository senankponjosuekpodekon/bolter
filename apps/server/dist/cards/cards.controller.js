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
exports.CardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cards_service_1 = require("./cards.service");
const create_card_dto_1 = require("./dto/create-card.dto");
const update_card_dto_1 = require("./dto/update-card.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let CardsController = class CardsController {
    constructor(cardsService) {
        this.cardsService = cardsService;
    }
    getAllCards(req) {
        return this.cardsService.findByUserId(req.user.id);
    }
    getCardsByAccount(accountId) {
        return this.cardsService.findByAccountId(accountId);
    }
    getCard(id) {
        return this.cardsService.findById(id);
    }
    createCard(req, createCardDto) {
        if (!createCardDto.accountId) {
            throw new common_1.BadRequestException('accountId is required');
        }
        return this.cardsService.create(req.user.id, createCardDto.accountId, createCardDto);
    }
    createCardAsAdmin(req, userId, accountId, createCardDto) {
        return this.cardsService.create(userId, accountId, createCardDto, true);
    }
    updateCard(req, id, updateCardDto) {
        return this.cardsService.update(req.user.id, id, updateCardDto);
    }
    deleteCard(req, id) {
        return this.cardsService.delete(req.user.id, id);
    }
};
exports.CardsController = CardsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all cards for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return cards' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "getAllCards", null);
__decorate([
    (0, common_1.Get)('account/:accountId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cards for an account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return cards' }),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "getCardsByAccount", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get card by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return card' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Card not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "getCard", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new card for an account' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Card successfully created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_card_dto_1.CreateCardDto]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "createCard", null);
__decorate([
    (0, common_1.Post)('admin/:userId/:accountId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create card for a user (Admin - bypasses limits)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Card successfully created' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Param)('accountId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_card_dto_1.CreateCardDto]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "createCardAsAdmin", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update card (block, unblock, etc.)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Card successfully updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Card not found' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_card_dto_1.UpdateCardDto]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "updateCard", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a card' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Card successfully deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Card not found' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "deleteCard", null);
exports.CardsController = CardsController = __decorate([
    (0, swagger_1.ApiTags)('cards'),
    (0, common_1.Controller)('cards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [cards_service_1.CardsService])
], CardsController);
//# sourceMappingURL=cards.controller.js.map