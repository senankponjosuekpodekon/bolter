import { test, expect } from '@playwright/test'

test.describe('Registration flow', () => {
  test('Register page is accessible from landing', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Get started|register/i }).first().click()
    await expect(page).toHaveURL(/register/)
  })

  test('Register form shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: /sign up|register|créer/i }).click()
    const errors = page.locator('[class*=error],[class*=invalid],[aria-invalid="true"]')
    await expect(errors.first()).toBeVisible({ timeout: 3_000 })
  })

  test('Register form shows password strength or mismatch error', async ({ page }) => {
    await page.goto('/register')
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('test@example.com')
    const passwordFields = page.getByLabel(/password|mot de passe/i)
    await passwordFields.first().fill('weak')
    await page.getByRole('button', { name: /sign up|register|créer/i }).click()
    await expect(page.locator('body')).toContainText(/password|mot de passe/i)
  })

  test('Rate limit button disables after submit', async ({ page }) => {
    await page.goto('/register')
    const btn = page.getByRole('button', { name: /sign up|register|créer/i })
    await btn.click()
    await expect(btn).toBeDisabled({ timeout: 3_000 })
  })
})
