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
exports.ExchangeController = void 0;
const common_1 = require("@nestjs/common");
const exchange_service_1 = require("./exchange.service");
const conversion_request_dto_1 = require("./dto/conversion-request.dto");
let ExchangeController = class ExchangeController {
    constructor(exchangeService) {
        this.exchangeService = exchangeService;
    }
    async getRates(baseCurrency = 'EUR') {
        const supported = this.exchangeService.getSupportedCurrencies();
        if (!supported.includes(baseCurrency.toUpperCase())) {
            throw new common_1.BadRequestException(`Currency ${baseCurrency} is not supported`);
        }
        return this.exchangeService.getMultipleRates(baseCurrency);
    }
    async convert(request) {
        try {
            const result = await this.exchangeService.convert(request.amount, request.from, request.to);
            return result;
        }
        catch (error) {
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'Conversion failed');
        }
    }
    async getSupportedCurrencies() {
        return this.exchangeService.getSupportedCurrencies();
    }
    async getRate(from, to) {
        const rate = await this.exchangeService.getRate(from, to);
        if (!rate) {
            throw new common_1.BadRequestException(`No rate available for ${from} -> ${to}`);
        }
        return { from: from.toUpperCase(), to: to.toUpperCase(), rate };
    }
    async convertQuery(amountStr, from = 'EUR', to = 'EUR') {
        const amount = Number(amountStr || '0');
        if (isNaN(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Amount must be a positive number');
        }
        try {
            const result = await this.exchangeService.convert(amount, from, to);
            return {
                amount: result.convertedAmount,
                originalAmount: result.originalAmount,
                rate: result.rate,
                from: result.from,
                to: result.to,
                timestamp: result.timestamp,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'Conversion failed');
        }
    }
};
exports.ExchangeController = ExchangeController;
__decorate([
    (0, common_1.Get)('rates'),
    __param(0, (0, common_1.Query)('base')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "getRates", null);
__decorate([
    (0, common_1.Post)('convert'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [conversion_request_dto_1.ConversionRequestDto]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "convert", null);
__decorate([
    (0, common_1.Get)('supported-currencies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "getSupportedCurrencies", null);
__decorate([
    (0, common_1.Get)('rate/:from/:to'),
    __param(0, (0, common_1.Param)('from')),
    __param(1, (0, common_1.Param)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "getRate", null);
__decorate([
    (0, common_1.Get)('convert'),
    __param(0, (0, common_1.Query)('amount')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "convertQuery", null);
exports.ExchangeController = ExchangeController = __decorate([
    (0, common_1.Controller)('exchange'),
    __metadata("design:paramtypes", [exchange_service_1.ExchangeService])
], ExchangeController);
//# sourceMappingURL=exchange.controller.js.map