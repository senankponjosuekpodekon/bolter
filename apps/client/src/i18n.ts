import i18n from 'i18next'
import type { Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import only common namespace for EN (bundled by default)
import enCommon from './locales/en/common.json'

// Build resource structure with namespaces
const resources: Resource = {
    'en-US': {
        common: enCommon,
        // Other EN namespaces will be lazy-loaded
    },
}

/**
 * Load locale and all namespaces for a given language
 * Supports: en, fr
 * Namespaces: common, errors, kyc, transactions, admin, notifications
 */
async function loadLocale(locale: string) {
    const lang = locale.split('-')[0] // Extract language code (en, fr, etc.)
    const namespaces = ['common', 'errors', 'kyc', 'transactions', 'admin', 'notifications']

    for (const ns of namespaces) {
        if (i18n.hasResourceBundle(locale, ns)) continue // Skip if already loaded

        try {
            const module = await import(`./locales/${lang}/${ns}.json`)
            if (module && module.default) {
                i18n.addResources(locale, ns, module.default)
            }
        } catch (error) {
            console.warn(`Failed to load namespace '${ns}' for locale '${locale}'`)
            // Continue to next namespace — failure isn't fatal
        }
    }
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en-US',
        ns: ['common', 'errors', 'kyc', 'transactions', 'admin', 'notifications'],
        defaultNS: 'common',
        debug: false,
        interpolation: { escapeValue: false },
        detection: { order: ['querystring', 'localStorage', 'navigator'], caches: ['localStorage'], lookupQuerystring: 'lng' },
    })

export { loadLocale }

export default i18n
