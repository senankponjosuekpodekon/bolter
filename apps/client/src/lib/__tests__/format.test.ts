import { formatCurrency, formatNumber, formatDate } from '../format'
import { describe, test, expect } from 'vitest'

describe('format helpers', () => {
    test('formatCurrency formats USD for en-US', () => {
        expect(formatCurrency(1234.5, 'USD', 'en-US')).toBe('$1,234.50')
    })

    test('formatCurrency formats EUR for fr-FR', () => {
        // french formatting typically uses non-breaking space as thousands separator
        const formatted = formatCurrency(1234.5, 'EUR', 'fr-FR')
        // normalize any non-breaking spaces (regular or narrow)
        expect(formatted.replace(/[\u00A0\u202F]/g, ' ')).toBe('1 234,50 €')
    })

    test('formatNumber returns dash for invalid input', () => {
        expect(formatNumber(undefined as unknown as number)).toBe('—')
    })

    test('formatDate formats a date for en-US', () => {
        const d = new Date('2020-05-10T00:00:00Z')
        // month is short name (May)
        expect(formatDate(d, 'en-US')).toMatch(/May|mai/) // allow locale-specific matching
    })
})
