import { test, expect, authenticatedPage, DEMO_TRANSACTION } from '../fixtures'

test.describe('Transactions page', () => {
  test('Shows transactions page for authenticated user', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/transactions')
    await expect(page.getByRole('heading', { name: /transactions/i })).toBeVisible()
  })

  test('Lists the mocked transaction with its description', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/transactions')
    await expect(page.getByText(DEMO_TRANSACTION.description)).toBeVisible({ timeout: 8_000 })
  })

  test('Export CSV button is visible', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/transactions')
    await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible({ timeout: 8_000 })
  })

  test('Search filters the transaction list', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/transactions')
    await expect(page.getByText(DEMO_TRANSACTION.description)).toBeVisible({ timeout: 8_000 })
    await page.getByPlaceholder(/search/i).fill('nonexistent-query')
    await expect(page.getByText(DEMO_TRANSACTION.description)).toBeHidden({ timeout: 5_000 })
  })

  test('Deposit action on dashboard opens the transaction modal', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /deposit|dépôt/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })
  })

  test('Unauthenticated user cannot access /transactions', async ({ page }) => {
    await page.goto('/transactions')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
