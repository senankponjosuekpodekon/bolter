import { test, expect, authenticatedPage, DEMO_2FA_EMAIL } from '../fixtures'

const DEMO_EMAIL = 'alice@demo.bolter.app'
const DEMO_PASSWORD = 'Demo1234!'

test.describe('Authentication flow', () => {
  test('Landing page is visible for unauthenticated users', async ({ page }) => {
    test.skip(test.info().project.use.isMobile === true, 'nav links hidden on mobile')
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
    await expect(page.getByRole('alert')).toContainText(/invalid credentials/i, { timeout: 5_000 })
    await expect(page).toHaveURL(/login/)
  })

  test('Login with 2FA-enabled account shows the verification modal', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(DEMO_2FA_EMAIL)
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /sign in|login|connexion/i }).click()
    await expect(page.getByRole('heading', { name: /verify 2fa/i })).toBeVisible({ timeout: 5_000 })
  })

  test('Authenticated user is redirected from / to dashboard', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/')
    await expect(page).toHaveURL(/dashboard/, { timeout: 8_000 })
  })

  test('Authenticated user visiting /login is redirected to dashboard', async ({ page }) => {
    await authenticatedPage(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/dashboard/, { timeout: 8_000 })
  })

  test('Unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })

  test('Logout returns to login', async ({ page }) => {
    test.skip(test.info().project.use.isMobile === true, 'logout button hidden on mobile (drawer)')
    await authenticatedPage(page)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/dashboard/)
    await page.getByRole('button', { name: /logout|log out|déconnexion/i }).first().click()
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })
})
