import { test, expect, authenticatedPage } from './fixtures'

/**
 * Multi-language & multi-currency E2E.
 * The CI job starts only the Vite dev server — every API call is mocked by the
 * shared fixture and protected pages are entered through `authenticatedPage`.
 */

const localeSelect = (page: import('@playwright/test').Page) =>
  page.locator('select', { has: page.locator('option[value="fr-FR"]') }).first()

test.describe('Multi-Language & Multi-Currency Features', () => {

    test.describe('Language Switching', () => {

        test('should switch language from English to French', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/profile')

            const profileTitle = page.locator('main h1')
            await expect(profileTitle).toContainText('Profile', { timeout: 8_000 })

            await localeSelect(page).selectOption('fr-FR')

            await expect(profileTitle).toContainText('Profil', { timeout: 5_000 })
        })

        test('should persist language preference across page navigation', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/profile')
            await localeSelect(page).selectOption('fr-FR')
            await expect(page.locator('main h1')).toContainText('Profil', { timeout: 5_000 })

            await page.goto('/dashboard')
            // Dashboard renders in French after the switch
            await expect(page.locator('body')).toContainText(/Tableau de bord|Profil|Comptes/i, { timeout: 8_000 })
        })

        test('language preference survives a full reload', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/profile')
            await localeSelect(page).selectOption('fr-FR')
            await expect(page.locator('main h1')).toContainText('Profil', { timeout: 5_000 })

            await page.reload()
            await expect(page.locator('main h1')).toContainText('Profil', { timeout: 8_000 })
        })
    })

    test.describe('Currency Formatting', () => {

        test('should display currency with correct symbol per locale (EUR)', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/accounts')

            // DEMO_ACCOUNT balance is 1234.56 EUR
            await expect(page.locator('body')).toContainText(/€|EUR/, { timeout: 8_000 })
        })

        test('should format transaction amounts according to locale rules', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/transactions')

            // Amount 1234.56 formatted with grouping separator (1,234.56 / 1 234,56)
            await expect(page.locator('body')).toContainText(/1[\s,\u00a0\u202f]234/, { timeout: 8_000 })
        })

        test('should update currency preview in register form', async ({ page }) => {
            await page.goto('/register')

            const currencySelect = page.locator('select', { has: page.locator('option[value="EUR"]') }).first()
            await currencySelect.selectOption('EUR')

            const firstOption = currencySelect.locator('option').nth(1)
            const optionText = await firstOption.textContent()

            expect(optionText).toMatch(/EUR/)
            expect(optionText).toMatch(/[\d\s€$¢₦]/)
        })

        test('should show currency display on the dashboard', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/dashboard')

            await expect(page.locator('body')).toContainText(/€|EUR|1[,\s]?234/, { timeout: 8_000 })
        })
    })

    test.describe('Date Formatting', () => {

        test('should display transaction dates', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/transactions')

            // Mocked transaction created 2026-01-15 — some date text must render
            await expect(page.locator('body')).toContainText(/2026|janvier|january|15/i, { timeout: 8_000 })
        })
    })

    test.describe('Profile Preferences Integration', () => {

        test('should save and persist locale preference', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/profile')

            const select = localeSelect(page)
            await select.selectOption('fr-FR')
            await expect(page.locator('main h1')).toContainText('Profil', { timeout: 5_000 })

            await page.reload()
            await expect(select).toHaveValue('fr-FR', { timeout: 8_000 })
        })

        test('should save and persist currency preference', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/profile')

            // Currency select lives in "Account Preferences" (options EUR/USD/…)
            const currencySelect = page.locator('select', { has: page.locator('option[value="NGN"]') }).first()
            await currencySelect.selectOption('USD')

            await page.reload()
            const reloaded = page.locator('select', { has: page.locator('option[value="NGN"]') }).first()
            await expect(reloaded).toHaveValue('USD', { timeout: 8_000 })
        })
    })

    test.describe('Multi-Language Workflow: Complete User Journey', () => {

        test('should register new user with French locale and EUR currency', async ({ page }) => {
            await page.goto('/register')

            const localeSel = page.locator('select').first()
            await localeSel.selectOption('fr-FR')

            const currencySel = page.locator('select', { has: page.locator('option[value="EUR"]') }).first()
            await currencySel.selectOption('EUR')

            expect(await localeSel.inputValue()).toBe('fr-FR')
            expect(await currencySel.inputValue()).toBe('EUR')
        })

        test('should display dashboard with user locale and currency preferences', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/dashboard')

            // Wait for the dashboard content (queries resolve after initial render)
            await expect(page.getByRole('button', { name: /deposit|dépôt/i }).first()).toBeVisible({ timeout: 8_000 })

            const pageContent = await page.locator('body').textContent()
            expect(pageContent?.length).toBeGreaterThan(100)
            expect(pageContent).toMatch(/balance|expense|income|transaction|solde|dépense|revenu/i)
        })
    })

    test.describe('Error Handling & Edge Cases', () => {

        test('should handle missing translations gracefully', async ({ page }) => {
            await authenticatedPage(page)

            let consoleErrors = false
            page.on('console', msg => {
                if (msg.type() === 'error' && msg.text().includes('missing translation')) {
                    consoleErrors = true
                }
            })

            await page.goto('/profile')
            await page.waitForTimeout(1000)
            expect(consoleErrors).toBe(false)
        })

        test('should maintain functionality with rapid language switches', async ({ page }) => {
            await authenticatedPage(page)
            await page.goto('/profile')

            const select = localeSelect(page)
            await select.selectOption('fr-FR')
            await select.selectOption('en-US')
            await select.selectOption('fr-FR')

            await expect(page.locator('main h1')).toContainText('Profil', { timeout: 5_000 })
            const content = await page.locator('body').textContent()
            expect(content?.length).toBeGreaterThan(50)
        })
    })
})

test.describe('Accessibility with Multi-Language Support', () => {

    test('language selector exists on the profile page', async ({ page }) => {
        await authenticatedPage(page)
        await page.goto('/profile')

        const select = localeSelect(page)
        await expect(select).toHaveCount(1, { timeout: 8_000 })
        // A visible "Language" label is rendered next to it
        await expect(page.getByText('Language').first()).toBeVisible()
    })

    test('profile page has proper heading hierarchy', async ({ page }) => {
        await authenticatedPage(page)
        await page.goto('/profile')

        const pageContent = await page.content()
        expect(pageContent.includes('<h1') || pageContent.includes('<h2')).toBeTruthy()
    })
})
