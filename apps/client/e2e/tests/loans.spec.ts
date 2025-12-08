import { test, expect } from '@playwright/test'

test.describe('Loans flow', () => {
  test('KYC blocked - user with SUBMITTED status cannot submit loan', async ({ page }) => {
    // seed localStorage for auth-store persist
    const user = { id: 'u1', email: 'a@b', kyc_status: 'SUBMITTED' }
    await page.addInitScript((u) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u } }))
    }, user)

    await page.goto('/loans')
    await expect(page.getByText(/Complete your KYC verification/i)).toBeVisible()
  })

  test('Approved KYC — user can access loan request form', async ({ page }) => {
    const user = { id: 'u1', email: 'a@b', kyc_status: 'APPROVED' }
    await page.addInitScript((u) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u } }))
    }, user)

    await page.goto('/loans')
    await expect(page.getByText('Request a loan')).toBeVisible()
  })
})
