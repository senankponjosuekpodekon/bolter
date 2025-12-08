import { Injectable, Logger } from '@nestjs/common';
import { ConversionResult } from './interfaces/exchange-rate.interface';

/**
 * Exchange service with comprehensive currency support and caching.
 * Supports EUR, USD, GBP, CAD, AED, NGN, GHS, ZAR, XOF.
 * Uses in-memory cache with TTL. Replace with real provider in production.
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

        // Get from base rates
        const baseRate = this.baseRates[from]?.[to];
        if (baseRate) {
            this.rateCache.set(cacheKey, {
                rate: baseRate,
                expiry: new Date(Date.now() + this.CACHE_TTL_MS),
            });
            return baseRate;
        }

        // Try reverse rate if available
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
