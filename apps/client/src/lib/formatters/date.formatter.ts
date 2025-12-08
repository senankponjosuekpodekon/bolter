/**
 * Date Formatter - Frontend
 * Formats dates with locale-specific formats
 */

type DateFormat = 'short' | 'long' | 'full'

const LOCALE_MAP: Record<string, string> = {
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'fr-FR': 'fr-FR',
    'fr-CA': 'fr-CA',
    'ar-AE': 'ar-AE',
    'pt-PT': 'pt-PT',
    'sw-KE': 'sw-KE',
}

const DATE_FORMAT_OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' } as Intl.DateTimeFormatOptions,
    long: { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions,
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions,
}

/**
 * Format date with locale-specific format
 * @example formatDate(new Date('2025-12-06'), 'short', 'en-US') => "12/6/2025"
 * @example formatDate(new Date('2025-12-06'), 'long', 'fr-FR') => "6 décembre 2025"
 */
export function formatDate(date: Date | string | number, format: DateFormat = 'long', locale: string = 'en-US'): string {
    const dateObj = date instanceof Date ? date : new Date(date)
    const localeCode = LOCALE_MAP[locale] || 'en-US'

    return new Intl.DateTimeFormat(localeCode, DATE_FORMAT_OPTIONS[format]).format(dateObj)
}

/**
 * Format time with locale-specific format
 * @example formatTime(new Date('2025-12-06T14:30:45'), 'en-US') => "2:30:45 PM"
 */
export function formatTime(date: Date | string | number, locale: string = 'en-US'): string {
    const dateObj = date instanceof Date ? date : new Date(date)
    const localeCode = LOCALE_MAP[locale] || 'en-US'

    return new Intl.DateTimeFormat(localeCode, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: locale.includes('en'),
    }).format(dateObj)
}

/**
 * Format date and time together
 * @example formatDateTime(new Date('2025-12-06T14:30:45'), 'en-US') => "December 6, 2025 at 2:30:45 PM"
 */
export function formatDateTime(date: Date | string | number, format: DateFormat = 'long', locale: string = 'en-US'): string {
    const dateObj = date instanceof Date ? date : new Date(date)
    const localeCode = LOCALE_MAP[locale] || 'en-US'

    const dateStr = new Intl.DateTimeFormat(localeCode, DATE_FORMAT_OPTIONS[format]).format(dateObj)
    const timeStr = new Intl.DateTimeFormat(localeCode, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: locale.includes('en'),
    }).format(dateObj)

    return `${dateStr} at ${timeStr}`
}

/**
 * Format date relative to now (e.g., "2 days ago", "in 3 hours")
 * @example formatRelative(new Date(Date.now() - 2*24*60*60*1000), 'en-US') => "2 days ago"
 */
export function formatRelative(date: Date | string | number, locale: string = 'en-US'): string {
    const dateObj = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSecs = Math.round(diffMs / 1000)
    const diffMins = Math.round(diffSecs / 60)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)

    const isEnglish = locale.includes('en')

    if (diffSecs < 60) {
        return isEnglish ? 'just now' : 'à l\'instant'
    }
    if (diffMins < 60) {
        return isEnglish ? `${diffMins} minute${diffMins > 1 ? 's' : ''} ago` : `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`
    }
    if (diffHours < 24) {
        return isEnglish ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` : `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
    }
    if (diffDays < 7) {
        return isEnglish ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` : `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    }

    return formatDate(dateObj, 'long', locale)
}

/**
 * Parse date string to Date object
 * @example parseDate("2025-12-06") => Date
 */
export function parseDate(dateStr: string): Date {
    return new Date(dateStr)
}
