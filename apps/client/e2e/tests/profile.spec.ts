import { test, expect, authenticatedPage } from '../fixtures'

test.describe('Profile / KYC / 2FA flows', () => {
  test('hash deep link opens the KYC tab', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/profile#profile-kyc')
    await expect(page.getByRole('tab', { name: /kyc/i })).toHaveAttribute('aria-selected', 'true', { timeout: 8_000 })
    await expect(page.getByText(/Vérification KYC|KYC Verification/i)).toBeVisible({ timeout: 8_000 })
  })

  test('hash deep link opens the 2FA tab', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/profile#profile-2fa')
    await expect(page.getByRole('tab', { name: /2fa|sécurité/i })).toHaveAttribute('aria-selected', 'true', { timeout: 8_000 })
    await expect(page.getByText(/Authentification à deux facteurs/i)).toBeVisible({ timeout: 8_000 })
  })

  test('profile tab bar exposes Profile, KYC and Security tabs', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/profile')
    await expect(page.getByRole('tab', { name: /^profil$|^profile$/i })).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('tab', { name: /^kyc$/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /2fa|sécurité/i })).toBeVisible()
  })

  test('mobile viewport - profile top tabs are visible and not overlapped by bottom nav', async ({ page }) => {
    await authenticatedPage(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/profile')
    await expect(page.getByRole('tab', { name: /profil/i }).first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('main')).not.toHaveCSS('padding-bottom', '0px')
  })
})
