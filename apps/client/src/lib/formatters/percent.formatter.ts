/**
 * Percentage Formatter - Frontend
 * Specialized formatter for percentage values with different precisions
 */

interface PercentFormatOptions {
    decimalPlaces?: number
    addSymbol?: boolean
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
 * Format value as percentage (0-100 or 0-1 automatically detected)
 * @example formatPercentage(25, 'en-US') => "25%"
 * @example formatPercentage(0.25, 'en-US') => "25%"
 * @example formatPercentage(0.256, 'en-US', { decimalPlaces: 2 }) => "25.60%"
 */
export function formatPercentage(value: number, locale: string = 'en-US', options: PercentFormatOptions = {}): string {
    const { decimalPlaces = 0, addSymbol = true } = options

    // Auto-detect: if value is 0-1, treat as decimal, else as percentage
    const percentage = value <= 1 ? value * 100 : value

    const localeCode = LOCALE_MAP[locale] || 'en-US'
    const formatted = new Intl.NumberFormat(localeCode, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(percentage)

    return addSymbol ? `${formatted}%` : formatted
}

/**
 * Format change percentage (shows sign + color indication)
 * @example formatChangePercentage(5.25) => "+5.25%"
 * @example formatChangePercentage(-2.5) => "-2.50%"
 */
export function formatChangePercentage(
    value: number,
    locale: string = 'en-US',
    decimalPlaces: number = 2
): { formatted: string; isPositive: boolean; sign: string } {
    const sign = value > 0 ? '+' : value < 0 ? '-' : ''
    const absValue = Math.abs(value)
    const localeCode = LOCALE_MAP[locale] || 'en-US'

    const formatted = new Intl.NumberFormat(localeCode, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(absValue)

    return {
        formatted: `${sign}${formatted}%`,
        isPositive: value > 0,
        sign,
    }
}

/**
 * Parse percentage string to number (0-1 range)
 * @example parsePercentage("25%") => 0.25
 * @example parsePercentage("25.5%") => 0.255
 */
export function parsePercentage(formatted: string): number {
    const cleaned = formatted.replace(/[^\d.,\-]/g, '')
    const parsed = parseFloat(cleaned.replace(',', '.'))
    return isNaN(parsed) ? 0 : parsed / 100
}

/**
 * Format percentage with different styles
 * @example formatPercentageStyle(0.25, 'long', 'en-US') => "25 percent"
 * @example formatPercentageStyle(0.25, 'symbol', 'en-US') => "25%"
 */
export function formatPercentageStyle(value: number, style: 'symbol' | 'long' | 'short', locale: string = 'en-US'): string {
    const percentage = value <= 1 ? value * 100 : value
    const localeCode = LOCALE_MAP[locale] || 'en-US'

    if (style === 'symbol') {
        return `${new Intl.NumberFormat(localeCode, { maximumFractionDigits: 2 }).format(percentage)}%`
    }

    const isEnglish = locale.includes('en')
    const word = isEnglish ? 'percent' : 'pourcent'
    const shortWord = isEnglish ? 'pct' : 'pc'

    const formatted = new Intl.NumberFormat(localeCode, { maximumFractionDigits: 2 }).format(percentage)
    return `${formatted} ${style === 'long' ? word : shortWord}`
}

/**
 * Format percentage for progress bars or indicators
 * @example formatProgressPercent(75, 'en-US') => "75%"
 */
export function formatProgressPercent(value: number, locale: string = 'en-US', precision: number = 0): string {
    // Ensure value is between 0-100
    const clamped = Math.max(0, Math.min(100, value))
    return formatPercentage(clamped, locale, { decimalPlaces: precision, addSymbol: true })
}
