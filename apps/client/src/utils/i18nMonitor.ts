/**
 * i18n Monitor
 * 
 * Moniteur en temps réel du système de traduction.
 * Détecte automatiquement les problèmes et les erreurs.
 */

import { i18n } from 'i18next';
import { i18nErrorManager, I18nErrorType } from './i18nErrorHandler';

export interface I18nMonitorConfig {
    checkMissingKeys?: boolean;
    checkNamespaces?: boolean;
    checkLocaleConsistency?: boolean;
    logToConsole?: boolean;
}

class I18nMonitor {
    private config: I18nMonitorConfig = {
        checkMissingKeys: true,
        checkNamespaces: true,
        checkLocaleConsistency: true,
        logToConsole: true,
    };

    private supportedLocales = ['en-US', 'fr-FR'];
    private requiredNamespaces = [
        'common',
        'errors',
        'kyc',
        'transactions',
        'admin',
        'notifications',
    ];

    /**
     * Configure le moniteur
     */
    configure(config: Partial<I18nMonitorConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Initialise le monitoring sur une instance i18n
     */
    init(i18nInstance: i18n): void {
        // Écouter les événements i18n
        i18nInstance.on('missingKey', (lngs, namespace, key) => {
            if (this.config.checkMissingKeys) {
                const locale = Array.isArray(lngs) ? lngs[0] : lngs;
                i18nErrorManager.checkMissingKey(key, namespace, locale);
            }
        });

        i18nInstance.on('failedLoading', (lng, ns, msg) => {
            i18nErrorManager.logError(
                I18nErrorType.LOCALE_LOAD_FAILED,
                `Failed loading ${ns} for ${lng}: ${msg}`,
                { locale: lng, namespace: ns }
            );
        });

        i18nInstance.on('languageChanged', (lng) => {
            this.validateLanguageChange(i18nInstance, lng);
        });

        // Log initial
        if (this.config.logToConsole) {
            console.log('[i18n Monitor] Initialized', {
                currentLanguage: i18nInstance.language,
                loadedNamespaces: i18nInstance.languages,
            });
        }
    }

    /**
     * Valide le changement de langue
     */
    private validateLanguageChange(i18nInstance: i18n, newLanguage: string): void {
        // Vérifier que la locale est supportée
        if (!this.supportedLocales.includes(newLanguage)) {
            i18nErrorManager.logError(
                I18nErrorType.INVALID_LOCALE,
                `Unsupported locale: ${newLanguage}`,
                { locale: newLanguage }
            );
        }

        // Vérifier la cohérence avec localStorage
        if (this.config.checkLocaleConsistency) {
            const storedLocale = localStorage.getItem('i18nextLng');
            if (storedLocale && storedLocale !== newLanguage) {
                i18nErrorManager.checkLocaleMismatch(newLanguage, storedLocale);
            }
        }

        // Vérifier que les namespaces requis sont chargés
        if (this.config.checkNamespaces) {
            this.validateNamespaces(i18nInstance, newLanguage);
        }

        if (this.config.logToConsole) {
            console.log(`[i18n Monitor] Language changed to: ${newLanguage}`);
        }
    }

    /**
     * Valide que tous les namespaces requis sont chargés
     */
    private validateNamespaces(i18nInstance: i18n, locale: string): void {
        this.requiredNamespaces.forEach((ns) => {
            const hasNamespace = i18nInstance.hasResourceBundle(locale, ns);
            if (!hasNamespace) {
                i18nErrorManager.checkMissingNamespace(ns, locale);
            }
        });
    }

    /**
     * Effectue un audit complet du système i18n
     */
    audit(i18nInstance: i18n): {
        status: 'OK' | 'WARNING' | 'ERROR';
        issues: string[];
        details: {
            currentLocale: string;
            loadedNamespaces: string[];
            missingNamespaces: string[];
            localStorage: string | null;
            localeConsistent: boolean;
        };
    } {
        const issues: string[] = [];
        const currentLocale = i18nInstance.language;
        const storedLocale = localStorage.getItem('i18nextLng');

        // Vérifier la cohérence localStorage
        const localeConsistent = !storedLocale || storedLocale === currentLocale;
        if (!localeConsistent) {
            issues.push(
                `localStorage locale (${storedLocale}) differs from current locale (${currentLocale})`
            );
        }

        // Vérifier les namespaces manquants
        const missingNamespaces: string[] = [];
        this.requiredNamespaces.forEach((ns) => {
            if (!i18nInstance.hasResourceBundle(currentLocale, ns)) {
                missingNamespaces.push(ns);
                issues.push(`Missing namespace: ${ns} for locale ${currentLocale}`);
            }
        });

        // Récupérer les namespaces chargés
        const loadedNamespaces = this.requiredNamespaces.filter((ns) =>
            i18nInstance.hasResourceBundle(currentLocale, ns)
        );

        // Déterminer le statut
        let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';
        if (missingNamespaces.length > 0) {
            status = 'ERROR';
        } else if (!localeConsistent) {
            status = 'WARNING';
        }

        return {
            status,
            issues,
            details: {
                currentLocale,
                loadedNamespaces,
                missingNamespaces,
                localStorage: storedLocale,
                localeConsistent,
            },
        };
    }

    /**
     * Vérifie l'état de santé du système i18n
     */
    healthCheck(i18nInstance: i18n): boolean {
        const audit = this.audit(i18nInstance);
        return audit.status === 'OK';
    }

    /**
     * Génère un rapport de monitoring
     */
    generateReport(i18nInstance: i18n): string {
        const audit = this.audit(i18nInstance);
        const errorReport = i18nErrorManager.generateReport();

        let report = '=== i18n Monitoring Report ===\n\n';
        report += `Status: ${audit.status}\n`;
        report += `Current Locale: ${audit.details.currentLocale}\n`;
        report += `localStorage Locale: ${audit.details.localStorage || 'Not set'}\n`;
        report += `Locale Consistent: ${audit.details.localeConsistent ? 'Yes' : 'No'}\n\n`;

        report += `Loaded Namespaces (${audit.details.loadedNamespaces.length}):\n`;
        audit.details.loadedNamespaces.forEach((ns) => {
            report += `  ✅ ${ns}\n`;
        });

        if (audit.details.missingNamespaces.length > 0) {
            report += `\nMissing Namespaces (${audit.details.missingNamespaces.length}):\n`;
            audit.details.missingNamespaces.forEach((ns) => {
                report += `  ❌ ${ns}\n`;
            });
        }

        if (audit.issues.length > 0) {
            report += '\nIssues Found:\n';
            audit.issues.forEach((issue, index) => {
                report += `  ${index + 1}. ${issue}\n`;
            });
        }

        report += '\n' + errorReport;

        return report;
    }
}

// Instance singleton
export const i18nMonitor = new I18nMonitor();

// Expose dans window pour debugging (dev uniquement)
if (import.meta.env.DEV && typeof window !== 'undefined') {
    const devWindow = window as typeof window & { i18nMonitor?: typeof i18nMonitor };
    devWindow.i18nMonitor = i18nMonitor;
}
