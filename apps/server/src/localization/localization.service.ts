import { Injectable, Logger } from '@nestjs/common';

interface LocalizationMessages {
    [key: string]: string | LocalizationMessages;
}

@Injectable()
export class LocalizationService {
    private readonly logger = new Logger(LocalizationService.name);
    private messages: Map<string, LocalizationMessages> = new Map();

    constructor() {
        this.loadMessages();
    }

    private loadMessages(): void {
        // Load EN messages
        try {
            const enMessages = require('./messages/en.messages.json');
            this.messages.set('en', enMessages);
            this.logger.debug('Loaded EN localization messages');
        } catch (e) {
            this.logger.warn('Failed to load EN messages', e);
        }

        // Load FR messages
        try {
            const frMessages = require('./messages/fr.messages.json');
            this.messages.set('fr', frMessages);
            this.logger.debug('Loaded FR localization messages');
        } catch (e) {
            this.logger.warn('Failed to load FR messages', e);
        }
    }

    /**
     * Get a message by key and locale
     * @param key Dot-separated key (e.g., 'errors.validation.email')
     * @param locale Language code (e.g., 'en', 'fr')
     * @param params Variables to interpolate (e.g., { name: 'John' })
     * @returns Localized message with interpolated variables
     */
    getMessage(
        key: string,
        locale: string = 'en',
        params?: Record<string, string | number>,
    ): string {
        const messages = this.messages.get(locale) || this.messages.get('en');
        if (!messages) {
            return key; // Fallback to key itself
        }

        const keys = key.split('.');
        let message: any = messages;

        for (const k of keys) {
            if (typeof message === 'object' && message !== null && k in message) {
                message = message[k];
            } else {
                this.logger.warn(`Missing localization key: ${key} for locale: ${locale}`);
                return key;
            }
        }

        if (typeof message !== 'string') {
            return key;
        }

        // Interpolate variables
        if (params) {
            let result = message;
            for (const [key, value] of Object.entries(params)) {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)); // Alternative syntax
            }
            return result;
        }

        return message;
    }

    getSupportedLocales(): string[] {
        return Array.from(this.messages.keys());
    }

    addMessages(locale: string, messages: LocalizationMessages): void {
        this.messages.set(locale, messages);
        this.logger.debug(`Added/Updated messages for locale: ${locale}`);
    }
}
