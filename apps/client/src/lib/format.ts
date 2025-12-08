const DEFAULT_LOCALE = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US'
const DEFAULT_CURRENCY = 'EUR'

export function formatNumber(value?: number | null, locale = DEFAULT_LOCALE) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  try {
    return new Intl.NumberFormat(locale).format(Number(value))
  } catch {
    return String(value)
  }
}

export function formatCurrency(value?: number | null, currency: string = DEFAULT_CURRENCY, locale: string = DEFAULT_LOCALE) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value))
  } catch {
    return `${Number(value).toFixed(2)} ${currency}`
  }
}
export function formatDate(value?: string | Date | null, locale = DEFAULT_LOCALE, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  try {
    return new Intl.DateTimeFormat(locale, options || { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
  } catch {
    return date.toISOString()
  }
}
