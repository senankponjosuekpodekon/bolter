import { test, expect, authenticatedPage, DEMO_ACCOUNT } from '../fixtures'

test.describe('Accounts page', () => {
  test('Shows accounts page for authenticated user', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/accounts')
    await expect(page.getByRole('heading', { name: /my accounts/i })).toBeVisible()
    await expect(page.getByText(/1[ \u00a0\u202f]?234|1234/).first()).toBeVisible({ timeout: 8_000 })
  })

  test('Copy button is visible on account card', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/accounts')
    await expect(page.getByRole('button', { name: /copy|copier/i }).first()).toBeVisible({ timeout: 8_000 })
  })

  test('PDF export button is visible on account card', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/accounts')
    await expect(page.getByRole('button', { name: /pdf/i }).first()).toBeVisible({ timeout: 8_000 })
  })

  test('Account IBAN is displayed', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/accounts')
    await expect(page.getByText(new RegExp(DEMO_ACCOUNT.iban.slice(0, 10))).first()).toBeVisible({ timeout: 8_000 })
  })

  test('Unauthenticated user is redirected from /accounts to /login', async ({ page }) => {
    await page.goto('/accounts')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
