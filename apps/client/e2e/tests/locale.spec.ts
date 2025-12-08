import { test, expect } from '@playwright/test'

test.describe('Localization / i18n basic smoke', () => {
    test('login page respects querystring locale (fr-FR)', async ({ page }) => {
        await page.goto('/login?lng=fr-FR')
        await expect(page.getByRole('heading', { name: 'Connectez-vous à votre compte' })).toBeVisible()
    })

    test('register page respects querystring locale (en-US)', async ({ page }) => {
        await page.goto('/register?lng=en-US')
        await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    })
})
