"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberFormatter = void 0;
const common_1 = require("@nestjs/common");
let NumberFormatter = class NumberFormatter {
    formatNumber(value, locale = 'en-US', options) {
        const opts = {
            minimumFractionDigits: options?.minimumFractionDigits ?? 2,
            maximumFractionDigits: options?.maximumFractionDigits ?? 2,
            useGrouping: options?.useGrouping ?? true,
        };
        return new Intl.NumberFormat(this.mapLocale(locale), opts).format(value);
    }
    formatPercent(value, locale = 'en-US', decimalPlaces = 2) {
        const formatted = new Intl.NumberFormat(this.mapLocale(locale), {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(value);
        return `${formatted}%`;
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
exports.NumberFormatter = NumberFormatter;
exports.NumberFormatter = NumberFormatter = __decorate([
    (0, common_1.Injectable)()
], NumberFormatter);
//# sourceMappingURL=number.formatter.js.map