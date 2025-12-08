"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyFormatter = void 0;
const common_1 = require("@nestjs/common");
let CurrencyFormatter = class CurrencyFormatter {
    constructor() {
        this.currencySymbols = {
            EUR: '€',
            USD: '$',
            GBP: '£',
            CAD: '$',
            AED: 'د.إ',
            NGN: '₦',
            GHS: '₵',
            ZAR: 'R',
            XOF: 'CFA',
        };
        this.currencyPositions = {
            EUR: 'after',
            USD: 'before',
            GBP: 'before',
            CAD: 'before',
            AED: 'before',
            NGN: 'before',
            GHS: 'before',
            ZAR: 'before',
            XOF: 'after',
        };
    }
    formatCurrency(amount, currency, locale = 'en-US') {
        const symbol = this.currencySymbols[currency] || currency;
        const position = this.currencyPositions[currency] || 'before';
        const formatted = new Intl.NumberFormat(this.mapLocale(locale), {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
        if (position === 'before') {
            return `${symbol} ${formatted}`;
        }
        else {
            return `${formatted} ${symbol}`;
        }
    }
    mapLocale(locale) {
        const mapping = {
            'en-US': 'en-US',
            'en-GB': 'en-GB',
            'fr-FR': 'fr-FR',
            'fr-CA': 'fr-CA',
            'ar-AE': 'ar-AE',
            'pt-PT': 'pt-PT',
            'sw-KE': 'sw-KE',
        };
        return mapping[locale] || 'en-US';
    }
};
exports.CurrencyFormatter = CurrencyFormatter;
exports.CurrencyFormatter = CurrencyFormatter = __decorate([
    (0, common_1.Injectable)()
], CurrencyFormatter);
//# sourceMappingURL=currency.formatter.js.map