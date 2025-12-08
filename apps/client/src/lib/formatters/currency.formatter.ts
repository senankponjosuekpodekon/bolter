/**
 * Currency Formatter - Frontend
 * Formats amounts with currency symbols and locale-specific positioning
 */

type CurrencySymbol = '€' | '$' | '£' | 'د.إ' | '₦' | '₵' | 'R' | 'CFA'
type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CAD' | 'AED' | 'NGN' | 'GHS' | 'ZAR' | 'XOF'
type SymbolPosition = 'before' | 'after'

interface CurrencyFormatOptions {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    useSymbol?: boolean
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, CurrencySymbol> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CAD: '$',
    AED: 'د.إ',
    NGN: '₦',
    GHS: '₵',
    ZAR: 'R',
    XOF: 'CFA',
}

const SYMBOL_POSITIONS: Record<CurrencyCode, SymbolPosition> = {
    EUR: 'after',
    USD: 'before',
    GBP: 'before',
    CAD: 'before',
    AED: 'before',
    NGN: 'before',
    GHS: 'before',
    ZAR: 'after',
    XOF: 'after',
}

const LOCALE_MAP: Record<string, string> = {
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'fr-FR': 'fr-FR',
    'fr-CA': 'fr-CA',
    'ar-AE': 'ar-AE',
    'pt-PT': 'pt-PT',
    'sw-KE': 'sw-KE',
}

/**
 * Format amount with currency symbol and locale-specific positioning
 * @example formatCurrency(100, 'EUR', 'fr-FR') => "100€"
 * @example formatCurrency(100, 'USD', 'en-US') => "$100.00"
 */
export function formatCurrency(
    amount: number,
    currency: CurrencyCode,
    locale: string = 'en-US',
    options: CurrencyFormatOptions = {}
): string {
    const { minimumFractionDigits = 2, maximumFractionDigits = 2, useSymbol = true } = options

    // Get locale-specific number format
    const localeCode = LOCALE_MAP[locale] || 'en-US'
    const numberFormatter = new Intl.NumberFormat(localeCode, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping: true,
    })

    const formattedNumber = numberFormatter.format(amount)

    if (!useSymbol) {
        return formattedNumber
    }

    const symbol = CURRENCY_SYMBOLS[currency] || currency
    const position = SYMBOL_POSITIONS[currency] || 'before'

    if (position === 'before') {
        return `${symbol} ${formattedNumber}`
    } else {
        return `${formattedNumber} ${symbol}`
    }
}

/**
 * Format currency with ISO code instead of symbol
 * @example formatCurrencyISO(100, 'EUR') => "100.00 EUR"
 */
export function formatCurrencyISO(amount: number, currency: CurrencyCode, locale: string = 'en-US'): string {
    const localeCode = LOCALE_MAP[locale] || 'en-US'
    const numberFormatter = new Intl.NumberFormat(localeCode, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    })

    const formattedNumber = numberFormatter.format(amount)
    return `${formattedNumber} ${currency}`
}

/**
 * Parse currency string back to number
 * @example parseCurrency("100€") => 100
 */
export function parseCurrency(formatted: string): number {
    // Remove all non-numeric characters except decimal point and minus
    const cleaned = formatted.replace(/[^\d.,\-]/g, '')
    // Replace comma with dot if it's a thousands separator
    return parseFloat(cleaned.replace(',', '.'))
}
