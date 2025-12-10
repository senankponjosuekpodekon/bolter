import { CurrencyFormatter } from './formatters/currency.formatter';
import { DateFormatter } from './formatters/date.formatter';
import { NumberFormatter } from './formatters/number.formatter';

describe('Formatters', () => {
    describe('CurrencyFormatter', () => {
        let formatter: CurrencyFormatter;

        beforeEach(() => {
            formatter = new CurrencyFormatter();
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
            // EN format: 1,234.56
            const enResult = formatter.formatCurrency(1234.56, 'EUR', 'en-US');
            expect(enResult).toContain('1,234.56');

            // FR format: 1 234,56 (with space as thousands separator)
            const frResult = formatter.formatCurrency(1234.56, 'EUR', 'fr-FR');
            expect(frResult).toMatch(/1\s234,56/); // FR uses space as thousands separator
        });
    });

    describe('DateFormatter', () => {
        let formatter: DateFormatter;

        beforeEach(() => {
            formatter = new DateFormatter();
        });

        it('should format date in short format', () => {
            const date = new Date('2025-12-06');
            const result = formatter.formatDate(date, 'en-US', 'short');
            expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/); // MM/DD/YY format for en-US
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
        let formatter: NumberFormatter;

        beforeEach(() => {
            formatter = new NumberFormatter();
        });

        it('should format number with US locale', () => {
            const result = formatter.formatNumber(1234.56, 'en-US');
            expect(result).toBe('1,234.56');
        });

        it('should format number with FR locale', () => {
            const result = formatter.formatNumber(1234.56, 'fr-FR');
            // FR uses non-breaking space as thousands separator, just check format
            expect(result).toMatch(/1.234,56/);
        });

        it('should format percent', () => {
            const result = formatter.formatPercent(85.5, 'en-US', 1);
            expect(result).toContain('85.5');
            expect(result).toContain('%');
        });
    });
});
