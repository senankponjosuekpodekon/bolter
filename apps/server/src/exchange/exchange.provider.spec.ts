import { ExchangeService } from './exchange.service';

/* eslint-disable @typescript-eslint/no-explicit-any */

const LIVE_RATES = {
  USD: 1.20,
  GBP: 0.90,
  EUR: 1.0,
};

function makeService(config: Record<string, unknown> = {}) {
  const configService = { get: jest.fn((k: string) => config[k]) };
  return new ExchangeService(configService as any);
}

describe('ExchangeService — live provider', () => {
  const realFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  function okResponse(rates: Record<string, number> = LIVE_RATES) {
    return {
      ok: true,
      json: () => Promise.resolve({ result: 'success', conversion_rates: rates }),
    };
  }

  it('is disabled without configuration — no network call, static rates used', async () => {
    const service = makeService();
    const rate = await service.getRate('EUR', 'USD');
    expect(rate).toBe(1.08); // static matrix
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches live rates from the configured provider', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const service = makeService({ 'exchange.apiKey': 'test-key' });

    const rate = await service.getRate('EUR', 'USD');
    expect(rate).toBe(1.2);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://v6.exchangerate-api.com/v6/test-key/latest/EUR',
      expect.anything(),
    );
  });

  it('supports a custom provider URL without an API key', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const service = makeService({ 'exchange.apiUrl': 'https://open.er-api.com/v6/latest' });

    await service.getRate('EUR', 'USD');
    expect(fetchMock).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/EUR', expect.anything());
  });

  it('caches the rates table — one fetch serves multiple pairs', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const service = makeService({ 'exchange.apiKey': 'k' });

    await service.getRate('EUR', 'USD');
    await service.getRate('EUR', 'GBP');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the stale cached table when the provider goes down', async () => {
    const service = makeService({ 'exchange.apiKey': 'k', 'exchange.cacheTtlMs': 1 });
    fetchMock.mockResolvedValue(okResponse());
    expect(await service.getRate('EUR', 'USD')).toBe(1.2);

    // TTL expired — next call refetches; provider now fails → stale table
    await new Promise((r) => setTimeout(r, 5));
    (service as any).rateCache.clear();
    fetchMock.mockRejectedValue(new Error('provider down'));

    expect(await service.getRate('EUR', 'USD')).toBe(1.2);
  });

  it('falls back to the static matrix when no cached table exists', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));
    const service = makeService({ 'exchange.apiKey': 'k' });

    expect(await service.getRate('EUR', 'USD')).toBe(1.08);
  });

  it('falls back to static on malformed provider response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'error' }),
    });
    const service = makeService({ 'exchange.apiKey': 'k' });

    expect(await service.getRate('EUR', 'USD')).toBe(1.08);
  });

  it('falls back to static on provider HTTP error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const service = makeService({ 'exchange.apiKey': 'k' });

    expect(await service.getRate('EUR', 'USD')).toBe(1.08);
  });

  it('returns the live rate through convert()', async () => {
    fetchMock.mockResolvedValue(okResponse());
    const service = makeService({ 'exchange.apiKey': 'k' });

    const result = await service.convert(100, 'EUR', 'USD');
    expect(result.convertedAmount).toBe(120);
    expect(result.rate).toBe(1.2);
  });
});
