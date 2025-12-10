import i18n from 'i18next'
import type { Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { i18nErrorManager, I18nErrorType } from './utils/i18nErrorHandler'
import { i18nMonitor } from './utils/i18nMonitor'

// Import ALL namespaces for both languages (preload)
import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import enKyc from './locales/en/kyc.json'
import enTransactions from './locales/en/transactions.json'
import enAdmin from './locales/en/admin.json'
import enNotifications from './locales/en/notifications.json'

import frCommon from './locales/fr/common.json'
import frErrors from './locales/fr/errors.json'
import frKyc from './locales/fr/kyc.json'
import frTransactions from './locales/fr/transactions.json'
import frAdmin from './locales/fr/admin.json'
import frNotifications from './locales/fr/notifications.json'

// Build resource structure with ALL namespaces preloaded
const resources: Resource = {
    'en-US': {
        common: enCommon,
        errors: enErrors,
        kyc: enKyc,
        transactions: enTransactions,
        admin: enAdmin,
        notifications: enNotifications,
    },
    'fr-FR': {
        common: frCommon,
        errors: frErrors,
        kyc: frKyc,
        transactions: frTransactions,
        admin: frAdmin,
        notifications: frNotifications,
    },
}

/**
 * Load locale - now just validates since all resources are preloaded
 * Supports: en, fr
 * Namespaces: common, errors, kyc, transactions, admin, notifications
 */
async function loadLocale(locale: string) {
    // All resources are already loaded at startup
    // This function now just validates the locale exists
    console.log(`[loadLocale] Locale ${locale} resources already preloaded`)

    if (!['en-US', 'fr-FR'].includes(locale)) {
        console.warn(`Unsupported locale: ${locale}`)
        i18nErrorManager.logError(
            I18nErrorType.INVALID_LOCALE,
            `Unsupported locale: ${locale}`,
            { locale }
        )
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
        // Gestionnaire de clés manquantes
        saveMissing: false,
        missingKeyHandler: (lngs, ns, key) => {
            const locale = Array.isArray(lngs) ? lngs[0] : lngs
            i18nErrorManager.checkMissingKey(key, ns, locale)
        },
    })

// Initialiser le monitoring i18n
i18nMonitor.init(i18n)

// Expose i18n dans window pour debugging (dev uniquement)
if (import.meta.env.DEV && typeof window !== 'undefined') {
    const devWindow = window as typeof window & { i18n?: typeof i18n }
    devWindow.i18n = i18n
}

export { loadLocale }

export default i18n
