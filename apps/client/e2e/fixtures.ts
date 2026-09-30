import { test as base, expect, Page } from '@playwright/test'

/**
 * E2E fixtures: the CI has no backend, so every /api/** call is mocked and
 * the auth store is seeded directly (zustand persist format).
 */

export const DEMO_USER = {
  id: 'u1',
  email: 'alice@demo.bolter.app',
  first_name: 'Alice',
  last_name: 'Demo',
  role: 'CLIENT',
  status: 'ACTIVE',
  kyc_status: 'APPROVED',
  locale: 'en-US',
  currency: 'EUR',
  timezone: 'Europe/Paris',
  tenant_id: null,
  two_factor_enabled: false,
}

export const DEMO_ACCOUNT = {
  id: 'acc-1',
  user_id: 'u1',
  account_number: 'FR7612345000010001234567890',
  iban: 'FR7612345000010001234567890',
  type: 'CHECKING',
  account_type: 'CHECKING',
  balance: 1234.56,
  limit: 5000,
  currency: 'EUR',
  status: 'ACTIVE',
  created_at: '2026-01-15T10:00:00.000Z',
}

export const DEMO_TRANSACTION = {
  id: 'tx-1',
  from_account_id: 'acc-1',
  to_account_id: null,
  amount: 1234.56,
  currency: 'EUR',
  type: 'DEPOSIT',
  status: 'APPROVED',
  description: 'Salary deposit',
  created_at: '2026-01-15T10:30:00.000Z',
}

const LOGIN_RESPONSE = {
  accessToken: 'e2e-access-token',
  refreshToken: 'e2e-refresh-token',
  user: DEMO_USER,
  requires2FA: false,
}

export const DEMO_2FA_EMAIL = '2fa@demo.bolter.app'
export const TAKEN_EMAIL = 'taken@demo.bolter.app'

type UserOverrides = Record<string, unknown>

/** Seed the persisted zustand auth store. Conditional so that later
 *  navigations/reloads keep whatever the app wrote back to it. */
export async function injectAuth(page: Page, overrides: UserOverrides = {}) {
  const user = { ...DEMO_USER, ...overrides }
  await page.addInitScript((u) => {
    if (!localStorage.getItem('auth-storage')) {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user: u, accessToken: 'e2e-access-token', refreshToken: 'e2e-refresh-token', isAuthenticated: true, preferences: null },
          version: 0,
        }),
      )
    }
  }, user)
}

/** Mock the whole REST API. Specific endpoints get realistic payloads;
 *  everything else returns a benign empty payload. */
export async function mockApi(page: Page, userOverrides: UserOverrides = {}) {
  const user = { ...DEMO_USER, ...userOverrides }

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace(/^\/api/, '')
    const method = route.request().method()

    const respond = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    // --- auth ---
    if (path === '/auth/login' && method === 'POST') {
      const body = route.request().postDataJSON() as { email?: string; password?: string }
      if (body.password === 'WrongPassword!') {
        return respond({ message: 'Invalid credentials' }, 401)
      }
      if (body.email === DEMO_2FA_EMAIL) {
        return respond({
          ...LOGIN_RESPONSE,
          user: { ...user, email: DEMO_2FA_EMAIL, two_factor_enabled: true },
          requires2FA: true,
        })
      }
      return respond(LOGIN_RESPONSE)
    }
    if (path === '/auth/register' && method === 'POST') {
      const body = route.request().postDataJSON() as { email?: string }
      if (body.email === TAKEN_EMAIL) {
        return respond({ message: 'Email already in use' }, 409)
      }
      return respond(LOGIN_RESPONSE, 201)
    }
    if (path === '/auth/refresh' && method === 'POST') return respond({ accessToken: 'e2e-access-token-2' })
    if (path === '/auth/profile') return respond(user)
    if (path === '/auth/logout') return respond({ success: true })

    // --- 2FA ---
    if (path === '/auth/2fa/setup') {
      return respond({ secret: 'JBSWY3DPEHPK3PXP', qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' })
    }
    if (path === '/auth/2fa/enable' && method === 'POST') return respond({ success: true, message: '2FA enabled successfully' })
    if (path === '/auth/2fa/verify' && method === 'POST') {
      const body = route.request().postDataJSON() as { token?: string }
      if (body.token === '000000') return respond({ message: 'Invalid 2FA token' }, 400)
      return respond({ ...LOGIN_RESPONSE, valid: true })
    }

    // --- profile ---
    if (path === '/users/profile' && (method === 'PATCH' || method === 'PUT')) {
      const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>
      return respond({ ...user, ...body })
    }

    // --- data ---
    if (path.startsWith('/accounts')) return respond(method === 'GET' ? [DEMO_ACCOUNT] : DEMO_ACCOUNT)
    if (path.startsWith('/transactions')) return respond(method === 'GET' ? [DEMO_TRANSACTION] : DEMO_TRANSACTION)
    if (path.startsWith('/loans')) return respond([])
    if (path.startsWith('/cards')) return respond([])
    if (path.startsWith('/kyc')) return respond([])
    if (path.startsWith('/notifications')) return respond([])
    if (path.startsWith('/exchange')) return respond({ rate: 1.08, amount: 108 })
    if (path.startsWith('/audit-logs') || path.startsWith('/activity')) return respond([])

    if (method === 'PATCH' || method === 'PUT') return respond({ ...user })

    return respond({})
  })
}

/** Seed auth + mock API for a protected-route test. Call before page.goto. */
export async function authenticatedPage(page: Page, overrides?: UserOverrides) {
  await injectAuth(page, overrides)
  await mockApi(page, overrides)
}

/**
 * Extended test: the API is mocked on every page so the app never depends on
 * a real backend. Tests that need a logged-in user call `authenticatedPage`
 * before navigating; unauthenticated tests just `page.goto` directly.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await mockApi(page)
    await use(page)
  },
})

export { expect }
