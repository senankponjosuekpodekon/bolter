import { test, expect, TAKEN_EMAIL } from '../fixtures'

test.describe('Registration flow', () => {
  test('Register page is accessible from landing', async ({ page }) => {
    test.skip(test.info().project.use.isMobile === true, 'nav links hidden on mobile')
    await page.goto('/')
    await page.getByRole('link', { name: /Get started|register/i }).first().click()
    await expect(page).toHaveURL(/register/)
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
  })

  test('Empty submit keeps the user on the form with invalid required fields', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: /sign up|register|créer/i }).click()
    // HTML5 `required` blocks submission — the browser flags the fields
    await expect(page).toHaveURL(/register/)
    expect(await page.locator('form input:invalid').count()).toBeGreaterThanOrEqual(4)
  })

  test('Successful registration navigates to login', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel(/first name/i).fill('Bob')
    await page.getByLabel(/last name/i).fill('Martin')
    await page.getByLabel(/email/i).fill('bob@demo.bolter.app')
    await page.getByLabel(/password/i).fill('Str0ng!Pass')
    await page.getByRole('button', { name: /sign up|register|créer/i }).click()
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test('Server error (email already in use) is shown to the user', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel(/first name/i).fill('Bob')
    await page.getByLabel(/last name/i).fill('Martin')
    await page.getByLabel(/email/i).fill(TAKEN_EMAIL)
    await page.getByLabel(/password/i).fill('Str0ng!Pass')
    await page.getByRole('button', { name: /sign up|register|créer/i }).click()
    await expect(page.getByRole('alert')).toContainText(/already in use/i, { timeout: 5_000 })
    await expect(page).toHaveURL(/register/)
  })
})
