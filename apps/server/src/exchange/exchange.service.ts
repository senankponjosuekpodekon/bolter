import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversionResult } from './interfaces/exchange-rate.interface';

/**
 * Exchange service with comprehensive currency support and caching.
 * Supports EUR, USD, GBP, CAD, AED, NGN, GHS, ZAR, XOF.
 *
 * Rate resolution order:
 *   1. pair cache (TTL)
 *   2. live provider table (cached per base currency) — only when
 *      EXCHANGE_RATE_API_KEY or EXCHANGE_RATE_API_URL is configured
 *   3. last-good provider table (stale) when the provider is down
 *   4. static fallback matrix
 */
@Injectable()
export class ExchangeService {
    private readonly logger = new Logger(ExchangeService.name);

    // Base rates for all supported currencies (approximate, update as needed)
    private baseRates: Record<string, Record<string, number>> = {
        EUR: {
            USD: 1.08, GBP: 0.86, CAD: 1.40, AED: 3.98,
            NGN: 1250, GHS: 11.2, ZAR: 20.5, XOF: 655,
        },
        USD: {
            EUR: 0.93, GBP: 0.80, CAD: 1.30, AED: 3.67,
            NGN: 1160, GHS: 10.4, ZAR: 19.0, XOF: 606,
        },
        GBP: {
            EUR: 1.16, USD: 1.25, CAD: 1.62, AED: 4.58,
            NGN: 1450, GHS: 12.9, ZAR: 23.4, XOF: 750,
        },
        CAD: {
            EUR: 0.71, USD: 0.77, GBP: 0.62, AED: 2.83,
            NGN: 892, GHS: 7.95, ZAR: 14.4, XOF: 463,
        },
        AED: {
            EUR: 0.25, USD: 0.27, GBP: 0.22, CAD: 0.35,
            NGN: 314, GHS: 2.80, ZAR: 5.15, XOF: 164,
        },
        NGN: {
            EUR: 0.0008, USD: 0.00086, GBP: 0.00069, CAD: 0.0011,
            AED: 0.0032, GHS: 0.0089, ZAR: 0.0164, XOF: 0.522,
        },
        GHS: {
            EUR: 0.089, USD: 0.096, GBP: 0.077, CAD: 0.126,
            AED: 0.357, NGN: 112, ZAR: 1.84, XOF: 58.5,
        },
        ZAR: {
            EUR: 0.049, USD: 0.053, GBP: 0.043, CAD: 0.069,
            AED: 0.194, NGN: 61, GHS: 0.54, XOF: 31.8,
        },
        XOF: {
            EUR: 0.0015, USD: 0.0017, GBP: 0.0013, CAD: 0.0022,
            AED: 0.0061, NGN: 1.92, GHS: 0.017, ZAR: 0.031,
        },
    };

    // Cache for frequently accessed rates
    private rateCache: Map<string, { rate: number; expiry: Date }> = new Map();
    private readonly CACHE_TTL_MS = 3600000; // 1 hour

    // Provider rate tables keyed by base currency (+ last-good for stale fallback)
    private tableCache = new Map<string, { rates: Record<string, number>; expiry: number }>();
    private lastGoodTable = new Map<string, Record<string, number>>();

    constructor(@Optional() private readonly configService?: ConfigService) { }

    private get providerEnabled(): boolean {
        return Boolean(
            this.configService?.get<string>('exchange.apiKey') ||
            this.configService?.get<string>('exchange.apiUrl'),
        );
    }

    private get providerTimeoutMs(): number {
        return this.configService?.get<number>('exchange.timeoutMs') ?? 5000;
    }

    /** Fetch the full rates table for a base currency from the configured provider. */
    private async fetchProviderRates(base: string): Promise<Record<string, number>> {
        const apiKey = this.configService?.get<string>('exchange.apiKey');
        const apiUrl = this.configService?.get<string>('exchange.apiUrl');

        const url = apiKey
            ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
            : `${apiUrl}/${base}`;

        const res = await fetch(url, { signal: AbortSignal.timeout(this.providerTimeoutMs) });
        if (!res.ok) {
            throw new Error(`FX provider HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
            result?: string;
            conversion_rates?: Record<string, number>;
            rates?: Record<string, number>;
        };
        if (data.result === 'error') {
            throw new Error('FX provider returned an error');
        }
        const rates = data.conversion_rates ?? data.rates;
        if (!rates || typeof rates !== 'object') {
            throw new Error('FX provider response missing rates');
        }
        return rates;
    }

    /** Rates table for a base currency: fresh cache → provider → stale cache → static. */
    private async getRatesTable(base: string): Promise<{ rates: Record<string, number>; source: 'cache' | 'live' | 'stale' | 'static' }> {
        const ttl = this.configService?.get<number>('exchange.cacheTtlMs') ?? this.CACHE_TTL_MS;
        const cached = this.tableCache.get(base);
        if (cached && cached.expiry > Date.now()) {
            return { rates: cached.rates, source: 'cache' };
        }

        if (this.providerEnabled) {
            try {
                const rates = await this.fetchProviderRates(base);
                this.tableCache.set(base, { rates, expiry: Date.now() + ttl });
                this.lastGoodTable.set(base, rates);
                return { rates, source: 'live' };
            } catch (err) {
                this.logger.warn(
                    `FX provider unavailable for ${base}: ${err instanceof Error ? err.message : String(err)}`,
                );
                const stale = this.lastGoodTable.get(base);
                if (stale) {
                    this.logger.warn(`Using stale FX table for ${base}`);
                    return { rates: stale, source: 'stale' };
                }
            }
        }

        return { rates: this.baseRates[base] ?? {}, source: 'static' };
    }

    async getRate(from: string, to: string): Promise<number | null> {
        if (from === to) return 1;

        from = from.toUpperCase();
        to = to.toUpperCase();

        const cacheKey = `${from}:${to}`;

        // Check cache
        const cached = this.rateCache.get(cacheKey);
        if (cached && cached.expiry > new Date()) {
            this.logger.debug(`Cache hit for ${cacheKey}`);
            return cached.rate;
        }

        const { rates, source } = await this.getRatesTable(from);

        const direct = rates[to];
        if (typeof direct === 'number' && direct > 0) {
            this.rateCache.set(cacheKey, {
                rate: direct,
                expiry: new Date(Date.now() + this.CACHE_TTL_MS),
            });
            if (source !== 'static') {
                this.logger.debug(`FX rate ${cacheKey} = ${direct} (${source})`);
            }
            return direct;
        }

        // Fallback: inverse of the static reverse rate
        const reverseRate = this.baseRates[to]?.[from];
        if (reverseRate) {
            const calculatedRate = 1 / reverseRate;
            this.rateCache.set(cacheKey, {
                rate: calculatedRate,
                expiry: new Date(Date.now() + this.CACHE_TTL_MS),
            });
            this.logger.debug(`Calculated rate ${cacheKey} from reverse: ${calculatedRate}`);
            return calculatedRate;
        }

        this.logger.warn(`No exchange rate found for ${from} -> ${to}`);
        return null;
    }

    async getMultipleRates(baseCurrency: string): Promise<Record<string, number>> {
        const supported = this.getSupportedCurrencies();
        const rates: Record<string, number> = {};

        for (const currency of supported) {
            if (currency !== baseCurrency) {
                const rate = await this.getRate(baseCurrency, currency);
                if (rate) {
                    rates[currency] = rate;
                }
            }
        }

        return rates;
    }

    async convert(
        amount: number,
        from: string,
        to: string,
    ): Promise<ConversionResult> {
        const rate = await this.getRate(from, to);

        if (!rate) {
            throw new Error(`No exchange rate available for ${from} -> ${to}`);
        }

        const convertedAmount = Math.round(amount * rate * 100) / 100; // 2 decimal places

        return {
            originalAmount: amount,
            convertedAmount,
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            rate,
            timestamp: new Date(),
        };
    }

    getSupportedCurrencies(): string[] {
        return Object.keys(this.baseRates).sort();
    }

    clearCache(): void {
        this.rateCache.clear();
        this.logger.debug('Exchange rate cache cleared');
    }
}
