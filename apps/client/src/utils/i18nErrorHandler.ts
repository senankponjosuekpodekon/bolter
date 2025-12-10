/**
 * i18n Error Handler
 * 
 * Système de gestion d'erreurs pour le système de traduction.
 * Détecte, logue et reporte les erreurs de traduction.
 */

export enum I18nErrorType {
    MISSING_KEY = 'MISSING_KEY',
    MISSING_NAMESPACE = 'MISSING_NAMESPACE',
    LOCALE_LOAD_FAILED = 'LOCALE_LOAD_FAILED',
    LOCALE_MISMATCH = 'LOCALE_MISMATCH',
    INVALID_LOCALE = 'INVALID_LOCALE',
    TRANSLATION_FAILED = 'TRANSLATION_FAILED',
}

export interface I18nError {
    type: I18nErrorType;
    message: string;
    key?: string;
    namespace?: string;
    locale?: string;
    timestamp: Date;
    stack?: string;
}

class I18nErrorManager {
    private errors: I18nError[] = [];
    private errorCallbacks: ((error: I18nError) => void)[] = [];
    private maxErrors = 100; // Limite pour éviter la surcharge mémoire

    /**
     * Enregistre une erreur i18n
     */
    logError(
        type: I18nErrorType,
        message: string,
        details?: {
            key?: string;
            namespace?: string;
            locale?: string;
            stack?: string;
        }
    ): void {
        const error: I18nError = {
            type,
            message,
            timestamp: new Date(),
            ...details,
        };

        // Ajouter à la liste d'erreurs
        this.errors.push(error);

        // Limiter la taille
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Logger en console (développement uniquement)
        if (import.meta.env.DEV) {
            console.error(`[i18n Error] ${type}:`, message, details);
        }

        // Notifier les callbacks
        this.errorCallbacks.forEach((callback) => callback(error));
    }

    /**
     * Récupère toutes les erreurs
     */
    getErrors(): I18nError[] {
        return [...this.errors];
    }

    /**
     * Récupère les erreurs par type
     */
    getErrorsByType(type: I18nErrorType): I18nError[] {
        return this.errors.filter((error) => error.type === type);
    }

    /**
     * Récupère les erreurs récentes (dernières N minutes)
     */
    getRecentErrors(minutesAgo: number = 5): I18nError[] {
        const threshold = new Date(Date.now() - minutesAgo * 60 * 1000);
        return this.errors.filter((error) => error.timestamp >= threshold);
    }

    /**
     * Compte les erreurs par type
     */
    getErrorCounts(): Record<I18nErrorType, number> {
        const counts = {} as Record<I18nErrorType, number>;

        Object.values(I18nErrorType).forEach((type) => {
            counts[type] = 0;
        });

        this.errors.forEach((error) => {
            counts[error.type]++;
        });

        return counts;
    }

    /**
     * Efface toutes les erreurs
     */
    clearErrors(): void {
        this.errors = [];
    }

    /**
     * S'abonne aux erreurs
     */
    onError(callback: (error: I18nError) => void): () => void {
        this.errorCallbacks.push(callback);

        // Retourner une fonction de désabonnement
        return () => {
            this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
        };
    }

    /**
     * Vérifie si une clé de traduction manque
     */
    checkMissingKey(key: string, namespace: string, locale: string): void {
        this.logError(I18nErrorType.MISSING_KEY, `Missing translation key: ${key}`, {
            key,
            namespace,
            locale,
        });
    }

    /**
     * Vérifie si un namespace manque
     */
    checkMissingNamespace(namespace: string, locale: string): void {
        this.logError(
            I18nErrorType.MISSING_NAMESPACE,
            `Missing namespace: ${namespace}`,
            { namespace, locale }
        );
    }

    /**
     * Vérifie si le chargement d'une locale a échoué
     */
    checkLocaleLoadFailed(locale: string, error: Error): void {
        this.logError(
            I18nErrorType.LOCALE_LOAD_FAILED,
            `Failed to load locale: ${locale}`,
            {
                locale,
                stack: error.stack,
            }
        );
    }

    /**
     * Vérifie si les locales ne correspondent pas
     */
    checkLocaleMismatch(expected: string, actual: string): void {
        this.logError(
            I18nErrorType.LOCALE_MISMATCH,
            `Locale mismatch: expected ${expected}, got ${actual}`,
            {
                locale: expected,
            }
        );
    }

    /**
     * Génère un rapport d'erreurs
     */
    generateReport(): string {
        const counts = this.getErrorCounts();
        const recent = this.getRecentErrors(5);

        let report = '=== i18n Error Report ===\n\n';
        report += `Total Errors: ${this.errors.length}\n`;
        report += `Recent Errors (last 5 min): ${recent.length}\n\n`;

        report += 'Error Counts by Type:\n';
        Object.entries(counts).forEach(([type, count]) => {
            if (count > 0) {
                report += `  - ${type}: ${count}\n`;
            }
        });

        if (recent.length > 0) {
            report += '\nRecent Errors:\n';
            recent.forEach((error, index) => {
                report += `\n${index + 1}. [${error.type}] ${error.message}\n`;
                if (error.key) report += `   Key: ${error.key}\n`;
                if (error.namespace) report += `   Namespace: ${error.namespace}\n`;
                if (error.locale) report += `   Locale: ${error.locale}\n`;
                report += `   Time: ${error.timestamp.toLocaleTimeString()}\n`;
            });
        }

        return report;
    }

    /**
     * Exporte les erreurs en JSON
     */
    exportErrors(): string {
        return JSON.stringify(this.errors, null, 2);
    }
}

// Instance singleton
export const i18nErrorManager = new I18nErrorManager();

// Helper pour logger rapidement
export function logI18nError(
    type: I18nErrorType,
    message: string,
    details?: {
        key?: string;
        namespace?: string;
        locale?: string;
    }
): void {
    i18nErrorManager.logError(type, message, details);
}

// Expose dans window pour debugging (dev uniquement)
if (import.meta.env.DEV && typeof window !== 'undefined') {
    const devWindow = window as typeof window & { i18nErrorManager?: typeof i18nErrorManager };
    devWindow.i18nErrorManager = i18nErrorManager;
}
