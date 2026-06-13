import { test, expect } from '@playwright/test'

const seedAuth = (page: import('@playwright/test').Page, overrides = {}) =>
  page.addInitScript((u) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u, isAuthenticated: true } }))
  }, { id: 'u1', email: 'alice@demo.bolter.app', role: 'CLIENT', kyc_status: 'APPROVED', ...overrides })

test.describe('Accounts page', () => {
  test('Shows accounts page for authenticated user', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/accounts')
    await expect(page.getByText(/accounts|comptes/i).first()).toBeVisible()
  })

  test('Copy button is visible on account card', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/accounts')
    const copyBtn = page.getByRole('button', { name: /copy/i }).first()
    await expect(copyBtn).toBeVisible({ timeout: 8_000 })
  })

  test('PDF export button is visible on account card', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/accounts')
    const pdfBtn = page.getByRole('button', { name: /pdf/i }).first()
    await expect(pdfBtn).toBeVisible({ timeout: 8_000 })
  })

  test('Unauthenticated user is redirected from /accounts to /login', async ({ page }) => {
    await page.goto('/accounts')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
