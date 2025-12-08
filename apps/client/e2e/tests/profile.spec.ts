import { test, expect } from '@playwright/test'

test.describe('Profile / KYC / 2FA flows', () => {
  test('hash deep links switch active tab (KYC + 2FA)', async ({ page }) => {
    await page.goto('/profile#profile-kyc')
    await expect(page.getByText('KYC Documents')).toBeVisible()

    await page.goto('/profile#profile-2fa')
    await expect(page.getByText('Sécurité : Authentification à deux facteurs')).toBeVisible()
  })

  test('mobile viewport - profile top tabs are visible and not overlapped by bottom nav', async ({ page }) => {
    // emulate small mobile viewport
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/profile')
    // tabs should be visible at top
    await expect(page.getByRole('button', { name: 'Profil' })).toBeVisible()
    await expect(page.locator('main')).not.toHaveCSS('padding-bottom', '0px')
  })
})
