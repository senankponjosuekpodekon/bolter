"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFormatter = void 0;
const common_1 = require("@nestjs/common");
let DateFormatter = class DateFormatter {
    formatDate(date, locale = 'en-US', format = 'long') {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const options = {
            short: { year: '2-digit', month: '2-digit', day: '2-digit' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
        };
        return new Intl.DateTimeFormat(this.mapLocale(locale), options[format]).format(dateObj);
    }
    formatTime(date, locale = 'en-US') {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(this.mapLocale(locale), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(dateObj);
    }
    formatDateTime(date, locale = 'en-US') {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(this.mapLocale(locale), {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj);
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
exports.DateFormatter = DateFormatter;
exports.DateFormatter = DateFormatter = __decorate([
    (0, common_1.Injectable)()
], DateFormatter);
//# sourceMappingURL=date.formatter.js.map