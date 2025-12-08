import { test, expect } from '@playwright/test'
import * as speakeasy from 'speakeasy'

test.describe('2FA Setup → Enable → Login Flow', () => {
  let testEmail: string
  let testPassword: string
  let setupSecret: string

  test.beforeAll(async () => {
    // Use test credentials
    testEmail = `2fa-test-${Date.now()}@example.com`
    testPassword = 'TestPassword123!@#'
  })

  test('should complete full 2FA setup and enable flow', async ({ page }) => {
    // Step 1: Register a new user
    await page.goto('/auth/register')
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').first().fill(testPassword)
    await page.locator('input[type="password"][name="confirmPassword"]').fill(testPassword)

    await page.click('button:has-text("Register")')

    // Should be redirected to dashboard after registration
    await expect(page).toHaveURL(/\/(dashboard|app)/, { timeout: 5000 })

    // Step 2: Navigate to 2FA settings
    await page.goto('/profile#profile-2fa')
    await expect(page.getByText('Sécurité : Authentification à deux facteurs')).toBeVisible()

    // Step 3: Click setup 2FA button
    await page.click('button:has-text("Setup 2FA")')

    // Should display QR code and secret
    const secretElement = await page.locator('code, .secret-display').first()
    setupSecret = await secretElement.textContent() || ''
    expect(setupSecret).toBeTruthy()

    // Step 4: Generate TOTP code from the secret
    const totpCode = speakeasy.totp({
      secret: setupSecret,
      encoding: 'base32'
    })

    // Step 5: Enter the code to enable 2FA
    await page.locator('input[type="text"][placeholder*="code"]').fill(totpCode)
    await page.click('button:has-text("Enable")')

    // Should show success message
    await expect(page.locator('text=2FA enabled successfully')).toBeVisible({ timeout: 5000 })

    // Step 6: Logout
    await page.click('button:has-text("Logout")')
    await expect(page).toHaveURL('/auth/login', { timeout: 5000 })
  })

  test('should require 2FA code on login', async ({ page }) => {
    // Step 1: Login with credentials
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').fill(testPassword)
    await page.click('button:has-text("Login")')

    // Step 2: Should be redirected to 2FA code entry
    await expect(page.getByText('Enter your authenticator code')).toBeVisible({ timeout: 5000 })

    // Step 3: Generate TOTP code and enter it
    const totpCode = speakeasy.totp({
      secret: setupSecret,
      encoding: 'base32'
    })

    await page.locator('input[type="text"][placeholder*="code"]').fill(totpCode)
    await page.click('button:has-text("Verify")')

    // Step 4: Should login successfully and redirect to dashboard
    await expect(page).toHaveURL(/\/(dashboard|app)/, { timeout: 5000 })
  })

  test('should reject invalid 2FA code', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').fill(testPassword)
    await page.click('button:has-text("Login")')

    // Wait for 2FA prompt
    await expect(page.getByText('Enter your authenticator code')).toBeVisible({ timeout: 5000 })

    // Submit invalid code repeatedly to trigger rate limit
    for (let i = 0; i < 6; i++) {
      await page.locator('input[type="text"][placeholder*="code"]').fill('000000')
      await page.click('button:has-text("Verify")')
    }

    // Should show rate-limit message on the last attempt
    await expect(page.locator('text=Trop de tentatives')).toBeVisible({ timeout: 5000 })
  })
})
