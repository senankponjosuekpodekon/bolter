/**
 * useCurrency Hook
 * Provides currency conversion and formatting utilities
 */

import { useCallback, useState, useEffect } from 'react'
import { formatCurrency, formatCurrencyISO, parseCurrency } from '../lib/formatters'

type SupportedCurrency = Parameters<typeof formatCurrency>[1]

interface ExchangeRate {
    from: string
    to: string
    rate: number
    timestamp: string
}

interface ConversionResult {
    originalAmount: number
    convertedAmount: number
    from: string
    to: string
    rate: number
    timestamp: string
}

interface CurrencyOptions {
    defaultCurrency?: string
    locale?: string
}

export function useCurrency(options: CurrencyOptions = {}) {
    const { defaultCurrency = 'USD', locale = 'en-US' } = options

    const [currency, setCurrency] = useState(defaultCurrency)
    const [rates, setRates] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch exchange rates
    const fetchRates = useCallback(
        async (baseCurrency: string = currency) => {
            setLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/exchange/rates?base=${baseCurrency}`)
                if (!response.ok) throw new Error('Failed to fetch rates')

                const data = await response.json()
                setRates(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        },
        [currency]
    )

    // Get exchange rate between two currencies
    const getRate = useCallback(
        async (from: string, to: string): Promise<number | null> => {
            if (from === to) return 1

            try {
                const response = await fetch(`/api/exchange/rate/${from}/${to}`)
                if (!response.ok) return null

                const data: ExchangeRate = await response.json()
                return data.rate
            } catch {
                return null
            }
        },
        []
    )

    // Convert amount between currencies
    const convertAmount = useCallback(
        async (amount: number, fromCurrency: string, toCurrency: string): Promise<ConversionResult | null> => {
            if (fromCurrency === toCurrency) {
                return {
                    originalAmount: amount,
                    convertedAmount: amount,
                    from: fromCurrency,
                    to: toCurrency,
                    rate: 1,
                    timestamp: new Date().toISOString(),
                }
            }

            try {
                const response = await fetch('/api/exchange/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        from: fromCurrency,
                        to: toCurrency,
                    }),
                })

                if (!response.ok) return null
                return await response.json()
            } catch {
                return null
            }
        },
        []
    )

    // Format amount in specific currency
    const format = useCallback(
        (amount: number, curr: string = currency, useSymbol: boolean = true) => {
            return formatCurrency(amount, curr as SupportedCurrency, locale, { useSymbol })
        },
        [currency, locale]
    )

    // Format with ISO code
    const formatISO = useCallback(
        (amount: number, curr: string = currency) => {
            return formatCurrencyISO(amount, curr as SupportedCurrency, locale)
        },
        [currency, locale]
    )

    // Parse currency string to number
    const parse = useCallback((formatted: string) => {
        return parseCurrency(formatted)
    }, [])

    // Change current currency
    const changeCurrency = useCallback((newCurrency: string) => {
        setCurrency(newCurrency)
    }, [])

    // Fetch rates on mount and when currency changes
    useEffect(() => {
        fetchRates(currency)
    }, [currency, fetchRates])

    return {
        currency,
        changeCurrency,
        rates,
        loading,
        error,
        fetchRates,
        getRate,
        convertAmount,
        format,
        formatISO,
        parse,
    }
}

export type UseCurrencyReturn = ReturnType<typeof useCurrency>
