import { test, expect } from '@playwright/test'

const DEMO_EMAIL = 'alice@demo.bolter.app'
const DEMO_PASSWORD = 'Demo1234!'

test.describe('Authentication flow', () => {
  test('Landing page is visible for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Banking that works/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Get started/i }).first()).toBeVisible()
  })

  test('Login page redirects to dashboard after valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(DEMO_EMAIL)
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /sign in|login|connexion/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 })
  })

  test('Login shows error on wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(DEMO_EMAIL)
    await page.getByLabel(/password/i).fill('WrongPassword!')
    await page.getByRole('button', { name: /sign in|login|connexion/i }).click()
    await expect(page.getByRole('alert').or(page.locator('[class*=error]'))).toBeVisible({ timeout: 5_000 })
  })

  test('Authenticated user is redirected from / to dashboard', async ({ page }) => {
    const user = { id: 'u1', email: DEMO_EMAIL, role: 'CLIENT', kyc_status: 'APPROVED' }
    await page.addInitScript((u) => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u, isAuthenticated: true } }))
    }, user)
    await page.goto('/')
    await expect(page).toHaveURL(/dashboard/, { timeout: 8_000 })
  })

  test('Unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
