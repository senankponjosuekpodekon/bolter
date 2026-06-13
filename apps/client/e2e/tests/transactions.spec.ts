import { test, expect } from '@playwright/test'

const seedAuth = (page: import('@playwright/test').Page, overrides = {}) =>
  page.addInitScript((u) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u, isAuthenticated: true } }))
  }, { id: 'u1', email: 'alice@demo.bolter.app', role: 'CLIENT', kyc_status: 'APPROVED', ...overrides })

test.describe('Transactions page', () => {
  test('Shows transactions page for authenticated user', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/transactions')
    await expect(page.getByText(/transactions/i).first()).toBeVisible()
  })

  test('Shows deposit button or action', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/transactions')
    const depositBtn = page.getByRole('button', { name: /deposit|dépôt/i }).first()
    await expect(depositBtn).toBeVisible({ timeout: 8_000 })
  })

  test('Deposit modal opens on button click', async ({ page }) => {
    await seedAuth(page)
    await page.goto('/transactions')
    const depositBtn = page.getByRole('button', { name: /deposit|dépôt/i }).first()
    await depositBtn.click()
    await expect(page.getByRole('dialog').or(page.locator('[class*=modal]'))).toBeVisible({ timeout: 5_000 })
  })

  test('Unauthenticated user cannot access /transactions', async ({ page }) => {
    await page.goto('/transactions')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
