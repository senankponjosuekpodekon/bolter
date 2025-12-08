import { Injectable } from '@nestjs/common';

@Injectable()
export class DateFormatter {
    formatDate(
        date: Date | string,
        locale: string = 'en-US',
        format: 'short' | 'long' | 'full' = 'long',
    ): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        const options: Record<'short' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
            short: { year: '2-digit', month: '2-digit', day: '2-digit' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
        };

        return new Intl.DateTimeFormat(this.mapLocale(locale), options[format]).format(dateObj);
    }

    formatTime(
        date: Date | string,
        locale: string = 'en-US',
    ): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        return new Intl.DateTimeFormat(this.mapLocale(locale), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(dateObj);
    }

    formatDateTime(
        date: Date | string,
        locale: string = 'en-US',
    ): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        return new Intl.DateTimeFormat(this.mapLocale(locale), {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj);
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
