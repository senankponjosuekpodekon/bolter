/**
 * Small set of helpers to safely normalize and parse API/host strings.
 * This centralizes logic so different callers (api, sockets, notifications) behave the same
 * and we can robustly handle simulator inputs like ":3000" or "host:3000".
 */
export const normalizeApiBase = (raw?: string): string => {
    const value = (raw ?? '').trim()
    if (!value) return '/api'

    // Try absolute URL first
    try {
        const url = new URL(value)
        const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname
        if (!pathname || pathname === '') url.pathname = '/api'
        else if (!pathname.includes('/api')) url.pathname = `${pathname}/api`
        const s = url.toString()
        return s.endsWith('/') ? s.slice(0, -1) : s
    } catch {
        // value may be :3000, host:3000, //host, or a relative path. Try to resolve in-browser
        try {
            if (typeof window !== 'undefined' && window.location) {
                let candidate = value
                if (value.startsWith(':')) {
                    candidate = `${window.location.protocol}//${window.location.hostname}${value}`
                } else if (/^[^/]+:\d+$/.test(value)) {
                    candidate = `${window.location.protocol}//${value}`
                } else if (value.startsWith('//')) {
                    candidate = `${window.location.protocol}${value}`
                }

                const url = new URL(candidate, window.location.origin)
                const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname
                if (!pathname || pathname === '') url.pathname = '/api'
                else if (!pathname.includes('/api')) url.pathname = `${pathname}/api`
                const s2 = url.toString()
                return s2.endsWith('/') ? s2.slice(0, -1) : s2
            }
        } catch (e) {
            console.warn('normalizeApiBase: could not resolve with window.origin', e)
        }

        // Fallback: ensure protocol and add /api if needed
        const sanitized = value.endsWith('/') ? value.slice(0, -1) : value
        const withProto = sanitized.match(/^https?:\/\//i) ? sanitized : `http://${sanitized}`
        try {
            const url = new URL(withProto)
            if (!url.pathname.includes('/api')) url.pathname = (url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname || '') + '/api'
            const s3 = url.toString()
            return s3.endsWith('/') ? s3.slice(0, -1) : s3
        } catch {
            if (sanitized.endsWith('/api') || sanitized.includes('/api/')) return sanitized
            return `${sanitized}/api`
        }
    }
}

export const tryConstructUrl = (raw: string, base?: string): URL | null => {
    try {
        return base === undefined ? new URL(raw) : new URL(raw, base)
    } catch {
        return null
    }
}

export const deriveServerRoot = (raw?: string): string => {
    const base = normalizeApiBase(raw)
    // If normalizeApiBase produced a known URL, remove the trailing '/api' part and return origin+path
    try {
        const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
        const trimmed = url.pathname.replace(/\/?api\/?$/, '').replace(/\/$/, '')
        return `${url.origin}${trimmed ? trimmed : ''}`
    } catch {
        // base might be a relative string like '/api' — resolve against window origin if possible
        if (base === '/api') {
            return typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
        }
        // Best-effort fallback
        return base.replace(/\/?api\/?$/, '')
    }
}

export default normalizeApiBase
