export declare class CurrencyFormatter {
    private readonly currencySymbols;
    private readonly currencyPositions;
    formatCurrency(amount: number, currency: string, locale?: string): string;
    private mapLocale;
}
