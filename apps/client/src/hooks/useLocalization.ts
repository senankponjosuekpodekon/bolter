/**
 * useLocalization Hook
 * Provides localization utilities: current locale, language switching, interpolation
 */

import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'

interface LocalizationOptions {
    locale?: string
    fallback?: string
}

export function useLocalization(options: LocalizationOptions = {}) {
    const { locale: forcedLocale, fallback = 'en-US' } = options
    const { i18n, t } = useTranslation(['common', 'errors', 'kyc', 'transactions', 'admin'])

    // Get current locale
    const locale = forcedLocale || i18n.language || fallback

    // Get language code (en, fr, etc.)
    const languageCode = locale.split('-')[0]

    // Get supported locales
    const supportedLocales = useMemo(() => ['en-US', 'fr-FR'], [])

    // Change language/locale
    const changeLanguage = useCallback(
        async (newLocale: string) => {
            const lang = newLocale.split('-')[0] // Extract language code
            await i18n.changeLanguage(lang)
            localStorage.setItem('i18nextLng', lang)
        },
        [i18n]
    )

    // Get translated message with interpolation
    const getMessage = useCallback(
        (key: string, namespace: string = 'common', params?: Record<string, string | number>) => {
            // Try to get from specified namespace first
            const message = t(`${namespace}:${key}`, { defaultValue: key, ...params })

            if (message === key && namespace !== 'common') {
                // Fallback to common namespace
                return t(`common:${key}`, { defaultValue: key, ...params })
            }

            return message
        },
        [t]
    )

    // Interpolate custom messages
    const interpolate = useCallback((message: string, params: Record<string, string | number>): string => {
        return Object.entries(params).reduce((result, [key, value]) => {
            return result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
        }, message)
    }, [])

    // Get all messages for a namespace
    const getNamespaceMessages = useCallback(
        (namespace: string = 'common'): Record<string, any> => {
            try {
                return i18n.getResourceBundle(locale, namespace) || {}
            } catch {
                return {}
            }
        },
        [i18n, locale]
    )

    return {
        locale,
        languageCode,
        supportedLocales,
        changeLanguage,
        getMessage,
        interpolate,
        getNamespaceMessages,
        i18n,
        t,
    }
}

export type UseLocalizationReturn = ReturnType<typeof useLocalization>
