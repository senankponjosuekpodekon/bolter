export declare class NumberFormatter {
    formatNumber(value: number, locale?: string, options?: {
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
        useGrouping?: boolean;
    }): string;
    formatPercent(value: number, locale?: string, decimalPlaces?: number): string;
    private mapLocale;
}
