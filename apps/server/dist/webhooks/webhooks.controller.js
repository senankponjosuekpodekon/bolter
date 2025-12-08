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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = class WebhooksController {
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    async createWebhook(req, dto) {
        if (!dto.url || !dto.events || dto.events.length === 0) {
            throw new common_1.HttpException('Missing required fields', common_1.HttpStatus.BAD_REQUEST);
        }
        const webhook = await this.webhooksService.createWebhook(req.user.sub, dto);
        return { success: true, webhook };
    }
    async getUserWebhooks(req) {
        const webhooks = await this.webhooksService.getUserWebhooks(req.user.sub);
        return { success: true, webhooks };
    }
    async getWebhook(req, webhookId) {
        const webhook = await this.webhooksService.getWebhookById(req.user.sub, webhookId);
        if (!webhook) {
            throw new common_1.HttpException('Webhook not found', common_1.HttpStatus.NOT_FOUND);
        }
        return { success: true, webhook };
    }
    async updateWebhook(req, webhookId, dto) {
        const webhook = await this.webhooksService.updateWebhook(req.user.sub, webhookId, dto);
        if (!webhook) {
            throw new common_1.HttpException('Webhook not found', common_1.HttpStatus.NOT_FOUND);
        }
        return { success: true, webhook };
    }
    async deleteWebhook(req, webhookId) {
        const success = await this.webhooksService.deleteWebhook(req.user.sub, webhookId);
        if (!success) {
            throw new common_1.HttpException('Failed to delete webhook', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { success: true };
    }
    async getWebhookDeliveries(req, webhookId) {
        const deliveries = await this.webhooksService.getWebhookDeliveries(req.user.sub, webhookId);
        return { success: true, deliveries };
    }
    async retryDelivery(req, deliveryId) {
        const success = await this.webhooksService.retryWebhookDelivery(req.user.sub, deliveryId);
        if (!success) {
            throw new common_1.HttpException('Failed to retry delivery', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { success: true };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "createWebhook", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getUserWebhooks", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhook", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "updateWebhook", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Get)(':id/deliveries'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookDeliveries", null);
__decorate([
    (0, common_1.Post)('deliveries/:deliveryId/retry'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('deliveryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "retryDelivery", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map