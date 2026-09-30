import { test, expect, authenticatedPage } from '../fixtures'

test.describe('Loans flow', () => {
  test('KYC blocked - user with SUBMITTED status cannot open the loan form', async ({ page }) => {
    await authenticatedPage(page, { kyc_status: 'SUBMITTED' })
    await page.goto('/loans')
    // The CTA is disabled for non-approved KYC users
    await expect(page.getByRole('button', { name: /submit loan request/i }).first()).toBeDisabled({ timeout: 8_000 })
  })

  test('Approved KYC — user can access loan request form', async ({ page }) => {
    await authenticatedPage(page, { kyc_status: 'APPROVED' })
    await page.goto('/loans')
    await page.getByRole('button', { name: /submit loan request/i }).first().click()
    await expect(page.getByRole('heading', { name: /request a loan/i })).toBeVisible({ timeout: 8_000 })
  })
})
