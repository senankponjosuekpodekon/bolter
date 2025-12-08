"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const exchange_service_1 = require("./exchange.service");
describe('ExchangeService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [exchange_service_1.ExchangeService],
        }).compile();
        service = module.get(exchange_service_1.ExchangeService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getRate', () => {
        it('should return 1 for same currency', async () => {
            const rate = await service.getRate('EUR', 'EUR');
            expect(rate).toBe(1);
        });
        it('should return rate for supported pair EUR->USD', async () => {
            const rate = await service.getRate('EUR', 'USD');
            expect(rate).toBe(1.08);
        });
        it('should handle case insensitivity', async () => {
            const rate = await service.getRate('eur', 'usd');
            expect(rate).toBe(1.08);
        });
        it('should return null for unsupported pair', async () => {
            const rate = await service.getRate('XXX', 'YYY');
            expect(rate).toBeNull();
        });
        it('should use cache for repeated calls', async () => {
            const rate1 = await service.getRate('EUR', 'USD');
            const rate2 = await service.getRate('EUR', 'USD');
            expect(rate1).toBe(rate2);
        });
    });
    describe('getMultipleRates', () => {
        it('should return rates for all supported currencies', async () => {
            const rates = await service.getMultipleRates('EUR');
            expect(Object.keys(rates).length).toBeGreaterThan(0);
            expect(rates['USD']).toBe(1.08);
            expect(rates['GBP']).toBe(0.86);
        });
        it('should not include same currency in result', async () => {
            const rates = await service.getMultipleRates('EUR');
            expect(rates['EUR']).toBeUndefined();
        });
    });
    describe('convert', () => {
        it('should convert EUR to USD correctly', async () => {
            const result = await service.convert(100, 'EUR', 'USD');
            expect(result.originalAmount).toBe(100);
            expect(result.convertedAmount).toBe(108);
            expect(result.rate).toBe(1.08);
            expect(result.from).toBe('EUR');
            expect(result.to).toBe('USD');
        });
        it('should round to 2 decimal places', async () => {
            const result = await service.convert(10.33, 'EUR', 'USD');
            expect(result.convertedAmount).toBe(11.16);
        });
        it('should throw error for unsupported currency pair', async () => {
            await expect(service.convert(100, 'XXX', 'YYY')).rejects.toThrow();
        });
    });
    describe('getSupportedCurrencies', () => {
        it('should return list of supported currencies', () => {
            const currencies = service.getSupportedCurrencies();
            expect(currencies).toContain('EUR');
            expect(currencies).toContain('USD');
            expect(currencies).toContain('GBP');
            expect(currencies).toContain('CAD');
            expect(currencies).toContain('AED');
            expect(currencies).toContain('NGN');
            expect(currencies).toContain('GHS');
            expect(currencies).toContain('ZAR');
            expect(currencies).toContain('XOF');
            expect(currencies).toEqual([...currencies].sort());
        });
    });
    describe('clearCache', () => {
        it('should clear cache without error', () => {
            service.clearCache();
            expect(true).toBe(true);
        });
    });
});
//# sourceMappingURL=exchange.service.spec.js.map