import { test, expect, authenticatedPage, DEMO_2FA_EMAIL } from '../fixtures'

const DEMO_PASSWORD = 'Demo1234!'

test.describe('2FA settings (authenticated)', () => {
  test('setup flow shows QR code, secret and verify form', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/profile#profile-2fa')

    await expect(page.getByText(/Authentification à deux facteurs/i)).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: /activer la 2fa/i }).click()

    // QR setup card appears with the manual secret
    await expect(page.getByText(/Configurer l.authentificateur/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('code')).toContainText('JBSWY3DPEHPK3PXP')

    // Entering a 6-digit code enables the verify button
    await page.getByPlaceholder('000000').fill('123456')
    const verifyBtn = page.getByRole('button', { name: /^activer la 2fa$|^activer$/i })
    await expect(verifyBtn).toBeEnabled()
    await verifyBtn.click()

    // Success feedback
    await expect(page.getByText(/2FA activée/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('verify button stays disabled without a 6-digit code', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/profile#profile-2fa')
    await page.getByRole('button', { name: /activer la 2fa/i }).click()
    await expect(page.locator('code')).toContainText('JBSWY3DPEHPK3PXP', { timeout: 5_000 })

    await page.getByPlaceholder('000000').fill('123')
    await expect(page.getByRole('button', { name: /^activer la 2fa$|^activer$/i })).toBeDisabled()
  })
})

test.describe('2FA on login', () => {
  test('a 2FA-enabled account must enter a code after password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(DEMO_2FA_EMAIL)
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /sign in|login|connexion/i }).click()

    await expect(page.getByRole('heading', { name: /verify 2fa/i })).toBeVisible({ timeout: 5_000 })
    await page.getByPlaceholder('000000').fill('123456')
    await page.getByRole('button', { name: /^verify$/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 8_000 })
  })

  test('an invalid 2FA code shows an error and stays on the modal', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(DEMO_2FA_EMAIL)
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /sign in|login|connexion/i }).click()

    await expect(page.getByRole('heading', { name: /verify 2fa/i })).toBeVisible({ timeout: 5_000 })
    await page.getByPlaceholder('000000').fill('000000')
    await page.getByRole('button', { name: /^verify$/i }).click()

    await expect(page.getByRole('alert')).toContainText(/invalid 2fa token/i, { timeout: 5_000 })
    await expect(page.getByRole('heading', { name: /verify 2fa/i })).toBeVisible()
  })
})
