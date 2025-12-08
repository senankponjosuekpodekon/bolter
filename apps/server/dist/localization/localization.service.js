"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LocalizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalizationService = void 0;
const common_1 = require("@nestjs/common");
let LocalizationService = LocalizationService_1 = class LocalizationService {
    constructor() {
        this.logger = new common_1.Logger(LocalizationService_1.name);
        this.messages = new Map();
        this.loadMessages();
    }
    loadMessages() {
        try {
            const enMessages = require('./messages/en.messages.json');
            this.messages.set('en', enMessages);
            this.logger.debug('Loaded EN localization messages');
        }
        catch (e) {
            this.logger.warn('Failed to load EN messages', e);
        }
        try {
            const frMessages = require('./messages/fr.messages.json');
            this.messages.set('fr', frMessages);
            this.logger.debug('Loaded FR localization messages');
        }
        catch (e) {
            this.logger.warn('Failed to load FR messages', e);
        }
    }
    getMessage(key, locale = 'en', params) {
        const messages = this.messages.get(locale) || this.messages.get('en');
        if (!messages) {
            return key;
        }
        const keys = key.split('.');
        let message = messages;
        for (const k of keys) {
            if (typeof message === 'object' && message !== null && k in message) {
                message = message[k];
            }
            else {
                this.logger.warn(`Missing localization key: ${key} for locale: ${locale}`);
                return key;
            }
        }
        if (typeof message !== 'string') {
            return key;
        }
        if (params) {
            let result = message;
            for (const [key, value] of Object.entries(params)) {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
            }
            return result;
        }
        return message;
    }
    getSupportedLocales() {
        return Array.from(this.messages.keys());
    }
    addMessages(locale, messages) {
        this.messages.set(locale, messages);
        this.logger.debug(`Added/Updated messages for locale: ${locale}`);
    }
};
exports.LocalizationService = LocalizationService;
exports.LocalizationService = LocalizationService = LocalizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LocalizationService);
//# sourceMappingURL=localization.service.js.map