/**
 * useFormatting Hook
 * Provides access to all formatting utilities
 */

import { useCallback, useMemo } from 'react'
import {
    formatCurrency,
    formatCurrencyISO,
    parseCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelative,
    parseDate,
    formatNumber,
    formatPercent,
    formatCompact,
    parseNumber,
    formatVerbose,
    formatPercentage,
    formatChangePercentage,
    parsePercentage,
    formatPercentageStyle,
    formatProgressPercent,
} from '../lib/formatters'

interface FormattingOptions {
    locale?: string
}

type SupportedCurrency = Parameters<typeof formatCurrency>[1]
type FormatterType = 'currency' | 'date' | 'number' | 'percent'

export function useFormatting(options: FormattingOptions = {}) {
    const { locale = 'en-US' } = options

    // Currency formatters
    const currency = useMemo(
        () => ({
            format: (amount: number, curr: string = 'USD', useSymbol = true) =>
                formatCurrency(amount, curr as SupportedCurrency, locale, { useSymbol }),
            formatISO: (amount: number, curr: string = 'USD') =>
                formatCurrencyISO(amount, curr as SupportedCurrency, locale),
            parse: parseCurrency,
        }),
        [locale]
    )

    // Date formatters
    const date = useMemo(
        () => ({
            format: (d: Date | string | number, format: 'short' | 'long' | 'full' = 'long') =>
                formatDate(d, format, locale),
            time: (d: Date | string | number) => formatTime(d, locale),
            dateTime: (d: Date | string | number, format: 'short' | 'long' | 'full' = 'long') =>
                formatDateTime(d, format, locale),
            relative: (d: Date | string | number) => formatRelative(d, locale),
            parse: parseDate,
        }),
        [locale]
    )

    // Number formatters
    const number = useMemo(
        () => ({
            format: (value: number, options?: { min?: number; max?: number; group?: boolean }) =>
                formatNumber(value, locale, {
                    minimumFractionDigits: options?.min,
                    maximumFractionDigits: options?.max,
                    useGrouping: options?.group !== false,
                }),
            percent: (value: number, decimals = 0) => formatPercent(value, locale, decimals),
            compact: (value: number) => formatCompact(value, locale),
            verbose: (value: number) => formatVerbose(value, locale),
            parse: parseNumber,
        }),
        [locale]
    )

    // Percentage formatters
    const percent = useMemo(
        () => ({
            format: (value: number, decimals = 0, addSymbol = true) =>
                formatPercentage(value, locale, { decimalPlaces: decimals, addSymbol }),
            change: (value: number, decimals = 2) => formatChangePercentage(value, locale, decimals),
            style: (value: number, style: 'symbol' | 'long' | 'short' = 'symbol') =>
                formatPercentageStyle(value, style, locale),
            progress: (value: number, precision = 0) => formatProgressPercent(value, locale, precision),
            parse: parsePercentage,
        }),
        [locale]
    )

    // Get formatter by type
    const getFormatter = useCallback(
        (type: FormatterType) => {
            const formatters: Record<FormatterType, unknown> = {
                currency,
                date,
                number,
                percent,
            }
            return formatters[type] || null
        },
        [currency, date, number, percent]
    )

    return {
        locale,
        currency,
        date,
        number,
        percent,
        getFormatter,
    }
}

export type UseFormattingReturn = ReturnType<typeof useFormatting>
