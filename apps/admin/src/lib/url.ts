// Admin copy of url helpers — keep behavior consistent with client side.
export const normalizeApiBase = (raw?: string): string => {
    const value = (raw ?? '').trim()
    if (!value) return '/api'

    try {
        const url = new URL(value)
        const pathname = url.pathname.replace(/\/$/, '')
        if (!pathname || pathname === '') url.pathname = '/api'
        else if (!/\/api(\/|$)/.test(pathname)) url.pathname = `${pathname}/api`
        return url.toString().replace(/\/$/, '')
    } catch {
        try {
            if (typeof window !== 'undefined' && window.location) {
                let candidate = value
                if (value.startsWith(':')) {
                    candidate = `${window.location.protocol}//${window.location.hostname}${value}`
                } else if (/^[^:]+:\d+$/.test(value)) {
                    candidate = `${window.location.protocol}//${value}`
                } else if (value.startsWith('//')) {
                    candidate = `${window.location.protocol}${value}`
                }

                const url = new URL(candidate, window.location.origin)
                const pathname = url.pathname.replace(/\/$/, '')
                if (!pathname || pathname === '') url.pathname = '/api'
                else if (!/\/api(\/|$)/.test(pathname)) url.pathname = `${pathname}/api`
                return url.toString().replace(/\/$/, '')
            }
        } catch (e) {
            console.warn('normalizeApiBase (admin): could not resolve with window.origin', e)
        }

        const sanitized = value.replace(/\/$/, '')
        const withProto = sanitized.match(/^https?:\/\//i) ? sanitized : `http://${sanitized}`
        try {
            const url = new URL(withProto)
            if (!/\/api(\/|$)/.test(url.pathname)) url.pathname = (url.pathname.replace(/\/$/, '') || '') + '/api'
            return url.toString().replace(/\/$/, '')
        } catch {
            if (sanitized.endsWith('/api') || sanitized.includes('/api/')) return sanitized
            return `${sanitized}/api`
        }
    }
}

export const deriveServerRoot = (raw?: string): string => {
    const base = normalizeApiBase(raw)
    try {
        const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
        const trimmed = url.pathname.replace(/\/?api\/?$/, '').replace(/\/$/, '')
        return `${url.origin}${trimmed ? trimmed : ''}`
    } catch {
        if (base === '/api') return typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
        return base.replace(/\/?api\/?$/, '')
    }
}

export default normalizeApiBase
