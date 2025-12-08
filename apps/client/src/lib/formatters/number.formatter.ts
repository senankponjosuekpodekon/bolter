/**
 * Number Formatter - Frontend
 * Formats numbers with locale-specific separators
 */

interface NumberFormatOptions {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    useGrouping?: boolean
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
 * Format number with locale-specific separators
 * @example formatNumber(1234.56, 'en-US') => "1,234.56"
 * @example formatNumber(1234.56, 'fr-FR') => "1 234,56"
 */
export function formatNumber(value: number, locale: string = 'en-US', options: NumberFormatOptions = {}): string {
    const { minimumFractionDigits = 0, maximumFractionDigits = 3, useGrouping = true } = options

    const localeCode = LOCALE_MAP[locale] || 'en-US'
    return new Intl.NumberFormat(localeCode, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping,
    }).format(value)
}

/**
 * Format number as percentage
 * @example formatPercent(0.25, 'en-US') => "25%"
 * @example formatPercent(0.25, 'fr-FR', 2) => "25,00%"
 */
export function formatPercent(value: number, locale: string = 'en-US', decimalPlaces: number = 0): string {
    const localeCode = LOCALE_MAP[locale] || 'en-US'
    const formatted = new Intl.NumberFormat(localeCode, {
        style: 'percent',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(value)

    return formatted
}

/**
 * Format number as a compact representation (e.g., 1.2K, 3.5M)
 * @example formatCompact(1200, 'en-US') => "1.2K"
 * @example formatCompact(1500000, 'en-US') => "1.5M"
 */
export function formatCompact(value: number, locale: string = 'en-US'): string {
    if (value >= 1_000_000_000) {
        return formatNumber(value / 1_000_000_000, locale, { maximumFractionDigits: 1 }) + 'B'
    }
    if (value >= 1_000_000) {
        return formatNumber(value / 1_000_000, locale, { maximumFractionDigits: 1 }) + 'M'
    }
    if (value >= 1_000) {
        return formatNumber(value / 1_000, locale, { maximumFractionDigits: 1 }) + 'K'
    }

    return formatNumber(value, locale, { maximumFractionDigits: 0 })
}

/**
 * Parse formatted number back to number
 * @example parseNumber("1,234.56") => 1234.56
 * @example parseNumber("1 234,56") => 1234.56
 */
export function parseNumber(formatted: string): number {
    // Remove whitespace and common thousand separators
    let cleaned = formatted.replace(/\s/g, '').replace(/,/g, '')

    // If there's a comma followed by digits, treat comma as decimal separator
    if (formatted.includes(',') && !formatted.includes('.')) {
        const parts = formatted.split(',')
        if (parts[1] && parts[1].length <= 3) {
            // Likely a decimal separator in European format
            cleaned = formatted.replace(/[^\d.,]/g, '').replace(/,/g, '.')
        }
    }

    return parseFloat(cleaned)
}

/**
 * Format number with abbreviation in words
 * @example formatVerbose(1234, 'en-US') => "1 thousand"
 */
export function formatVerbose(value: number, locale: string = 'en-US'): string {
    const isEnglish = locale.includes('en')

    if (value >= 1_000_000_000) {
        const num = value / 1_000_000_000
        return `${formatNumber(num, locale, { maximumFractionDigits: 1 })} ${isEnglish ? 'billion' : 'milliard'}`
    }
    if (value >= 1_000_000) {
        const num = value / 1_000_000
        return `${formatNumber(num, locale, { maximumFractionDigits: 1 })} ${isEnglish ? 'million' : 'million'}`
    }
    if (value >= 1_000) {
        const num = value / 1_000
        return `${formatNumber(num, locale, { maximumFractionDigits: 1 })} ${isEnglish ? 'thousand' : 'mille'}`
    }

    return formatNumber(value, locale, { maximumFractionDigits: 0 })
}
