"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const currency_formatter_1 = require("./formatters/currency.formatter");
const date_formatter_1 = require("./formatters/date.formatter");
const number_formatter_1 = require("./formatters/number.formatter");
describe('Formatters', () => {
    describe('CurrencyFormatter', () => {
        let formatter;
        beforeEach(() => {
            formatter = new currency_formatter_1.CurrencyFormatter();
        });
        it('should format EUR currency with symbol after', () => {
            const result = formatter.formatCurrency(100, 'EUR', 'fr-FR');
            expect(result).toContain('€');
            expect(result).toContain('100');
        });
        it('should format USD currency with symbol before', () => {
            const result = formatter.formatCurrency(100, 'USD', 'en-US');
            expect(result).toContain('$');
            expect(result).toContain('100');
        });
        it('should handle locale-specific number formatting', () => {
            const enResult = formatter.formatCurrency(1234.56, 'EUR', 'en-US');
            expect(enResult).toContain('1,234.56');
            const frResult = formatter.formatCurrency(1234.56, 'EUR', 'fr-FR');
            expect(frResult).toMatch(/1\s234,56/);
        });
    });
    describe('DateFormatter', () => {
        let formatter;
        beforeEach(() => {
            formatter = new date_formatter_1.DateFormatter();
        });
        it('should format date in short format', () => {
            const date = new Date('2025-12-06');
            const result = formatter.formatDate(date, 'en-US', 'short');
            expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
        });
        it('should format date in long format', () => {
            const date = new Date('2025-12-06');
            const result = formatter.formatDate(date, 'fr-FR', 'long');
            expect(result).toContain('décembre');
            expect(result).toContain('2025');
        });
        it('should format time', () => {
            const date = new Date('2025-12-06T14:30:45');
            const result = formatter.formatTime(date, 'en-US');
            expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
        });
    });
    describe('NumberFormatter', () => {
        let formatter;
        beforeEach(() => {
            formatter = new number_formatter_1.NumberFormatter();
        });
        it('should format number with US locale', () => {
            const result = formatter.formatNumber(1234.56, 'en-US');
            expect(result).toBe('1,234.56');
        });
        it('should format number with FR locale', () => {
            const result = formatter.formatNumber(1234.56, 'fr-FR');
            expect(result).toMatch(/1.234,56/);
        });
        it('should format percent', () => {
            const result = formatter.formatPercent(85.5, 'en-US', 1);
            expect(result).toContain('85.5');
            expect(result).toContain('%');
        });
    });
});
//# sourceMappingURL=localization.spec.js.map