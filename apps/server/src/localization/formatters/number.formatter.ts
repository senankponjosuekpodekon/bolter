import { Injectable } from '@nestjs/common';

@Injectable()
export class NumberFormatter {
    formatNumber(
        value: number,
        locale: string = 'en-US',
        options?: {
            minimumFractionDigits?: number;
            maximumFractionDigits?: number;
            useGrouping?: boolean;
        },
    ): string {
        const opts: Intl.NumberFormatOptions = {
            minimumFractionDigits: options?.minimumFractionDigits ?? 2,
            maximumFractionDigits: options?.maximumFractionDigits ?? 2,
            useGrouping: options?.useGrouping ?? true,
        };

        return new Intl.NumberFormat(this.mapLocale(locale), opts).format(value);
    }

    formatPercent(
        value: number,
        locale: string = 'en-US',
        decimalPlaces: number = 2,
    ): string {
        const formatted = new Intl.NumberFormat(this.mapLocale(locale), {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(value);

        return `${formatted}%`;
    }

    private mapLocale(locale: string): string {
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
