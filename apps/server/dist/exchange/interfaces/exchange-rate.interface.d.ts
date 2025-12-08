export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    timestamp: Date;
    source: 'cache' | 'api' | 'calculated';
}
export interface ConversionResult {
    originalAmount: number;
    convertedAmount: number;
    from: string;
    to: string;
    rate: number;
    timestamp: Date;
}
