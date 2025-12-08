import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyFormatter {
    private readonly currencySymbols: Record<string, string> = {
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

    private readonly currencyPositions: Record<string, 'before' | 'after'> = {
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

    formatCurrency(
        amount: number,
        currency: string,
        locale: string = 'en-US',
    ): string {
        const symbol = this.currencySymbols[currency] || currency;
        const position = this.currencyPositions[currency] || 'before';

        const formatted = new Intl.NumberFormat(this.mapLocale(locale), {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        if (position === 'before') {
            return `${symbol} ${formatted}`;
        } else {
            return `${formatted} ${symbol}`;
        }
    }

    private mapLocale(locale: string): string {
        // Map common locales to Intl-compatible ones
        const mapping: Record<string, string> = {
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
}
