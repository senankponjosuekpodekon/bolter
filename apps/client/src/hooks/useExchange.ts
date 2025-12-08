/**
 * useExchange Hook
 * Provides exchange rate fetching and caching utilities
 */

import { useCallback, useState, useEffect, useRef } from 'react'

interface ExchangeRate {
    from: string
    to: string
    rate: number
    timestamp: string
}

interface CacheEntry {
    data: Record<string, number>
    timestamp: number
}

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export function useExchange(baseCurrency: string = 'EUR') {
    const [rates, setRates] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([])

    // Simple in-memory cache
    const cacheRef = useRef<Record<string, CacheEntry>>({})

    // Get cached rates or null if expired
    const getCachedRates = useCallback((currency: string): Record<string, number> | null => {
        const cached = cacheRef.current[currency]
        if (!cached) return null

        const isExpired = Date.now() - cached.timestamp > CACHE_DURATION
        if (isExpired) {
            delete cacheRef.current[currency]
            return null
        }

        return cached.data
    }, [])

    // Set cache for a currency
    const setCacheRates = useCallback((currency: string, data: Record<string, number>) => {
        cacheRef.current[currency] = {
            data,
            timestamp: Date.now(),
        }
    }, [])

    // Fetch supported currencies
    const fetchSupportedCurrencies = useCallback(async () => {
        try {
            const response = await fetch('/api/exchange/supported-currencies')
            if (!response.ok) throw new Error('Failed to fetch supported currencies')

            const currencies = await response.json()
            setSupportedCurrencies(currencies)
            return currencies
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            return []
        }
    }, [])

    // Fetch rates for a base currency
    const fetchRates = useCallback(
        async (base: string = baseCurrency) => {
            // Check cache first
            const cached = getCachedRates(base)
            if (cached) {
                setRates(cached)
                return cached
            }

            setLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/exchange/rates?base=${base}`)
                if (!response.ok) throw new Error('Failed to fetch rates')

                const data = await response.json()
                setCacheRates(base, data)
                setRates(data)
                return data
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
                return null
            } finally {
                setLoading(false)
            }
        },
        [baseCurrency, getCachedRates, setCacheRates]
    )

    // Get specific rate
    const getRate = useCallback(async (from: string, to: string): Promise<number | null> => {
        if (from === to) return 1

        try {
            const response = await fetch(`/api/exchange/rate/${from}/${to}`)
            if (!response.ok) return null

            const data: ExchangeRate = await response.json()
            return data.rate
        } catch {
            return null
        }
    }, [])

    // Convert amount
    const convert = useCallback(
        async (amount: number, from: string, to: string) => {
            if (from === to) return { amount, rate: 1 }

            try {
                const response = await fetch('/api/exchange/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, from, to }),
                })

                if (!response.ok) return null
                return await response.json()
            } catch {
                return null
            }
        },
        []
    )

    // Clear cache manually
    const clearCache = useCallback((currency?: string) => {
        if (currency) {
            delete cacheRef.current[currency]
        } else {
            cacheRef.current = {}
        }
    }, [])

    // Fetch rates on mount and when baseCurrency changes
    useEffect(() => {
        fetchRates(baseCurrency)
    }, [baseCurrency, fetchRates])

    // Fetch supported currencies on mount
    useEffect(() => {
        if (supportedCurrencies.length === 0) {
            fetchSupportedCurrencies()
        }
    }, [supportedCurrencies.length, fetchSupportedCurrencies])

    return {
        rates,
        loading,
        error,
        supportedCurrencies,
        fetchRates,
        fetchSupportedCurrencies,
        getRate,
        convert,
        clearCache,
    }
}

export type UseExchangeReturn = ReturnType<typeof useExchange>
