import { ConversionResult } from './interfaces/exchange-rate.interface';
export declare class ExchangeService {
    private readonly logger;
    private baseRates;
    private rateCache;
    private readonly CACHE_TTL_MS;
    getRate(from: string, to: string): Promise<number | null>;
    getMultipleRates(baseCurrency: string): Promise<Record<string, number>>;
    convert(amount: number, from: string, to: string): Promise<ConversionResult>;
    getSupportedCurrencies(): string[];
    clearCache(): void;
}
