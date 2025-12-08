export declare class DateFormatter {
    formatDate(date: Date | string, locale?: string, format?: 'short' | 'long' | 'full'): string;
    formatTime(date: Date | string, locale?: string): string;
    formatDateTime(date: Date | string, locale?: string): string;
    private mapLocale;
}
