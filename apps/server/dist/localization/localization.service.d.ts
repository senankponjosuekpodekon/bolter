interface LocalizationMessages {
    [key: string]: string | LocalizationMessages;
}
export declare class LocalizationService {
    private readonly logger;
    private messages;
    constructor();
    private loadMessages;
    getMessage(key: string, locale?: string, params?: Record<string, string | number>): string;
    getSupportedLocales(): string[];
    addMessages(locale: string, messages: LocalizationMessages): void;
}
export {};
