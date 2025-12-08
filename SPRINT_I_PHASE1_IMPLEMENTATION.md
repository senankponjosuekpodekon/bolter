# Sprint I - Phase 1: Backend Implementation Guide

**Objectif:** Construire les fondations backend pour multi-devise et multi-langue  
**Durée:** 2h 30min  
**Date de démarrage:** 6 décembre 2025

---

## 📋 Vue d'ensemble Phase 1

### Fichiers à créer/modifier:

```
src/
├── exchange/
│   ├── exchange.service.ts           [MODIFIER - Améliorer]
│   ├── exchange.controller.ts        [MODIFIER - Ajouter endpoints]
│   ├── exchange.module.ts            [MODIFIER - Ajouter service LocalizationService]
│   ├── dto/
│   │   ├── conversion-request.dto.ts [CRÉER]
│   │   └── conversion-response.dto.ts [CRÉER]
│   └── interfaces/
│       └── exchange-rate.interface.ts [CRÉER]
│
├── localization/
│   ├── localization.service.ts       [CRÉER]
│   ├── localization.controller.ts    [CRÉER - optionnel Phase 1]
│   ├── localization.module.ts        [CRÉER]
│   ├── messages/
│   │   ├── en.messages.json          [CRÉER]
│   │   └── fr.messages.json          [CRÉER]
│   └── formatters/
│       ├── currency.formatter.ts     [CRÉER]
│       ├── date.formatter.ts         [CRÉER]
│       └── number.formatter.ts       [CRÉER]
│
└── app.module.ts                     [MODIFIER - Import LocalizationModule]
```

---

## 🎯 Tâche 1: Améliorer ExchangeService (30min)

### État Actuel

```typescript
// apps/server/src/exchange/exchange.service.ts
private rates: Record<string, Record<string, number>> = {
    EUR: { USD: 1.08, CAD: 1.40, AED: 3.98, NGN: 1250, GHS: 11.2, ZAR: 20.5, XOF: 655 },
    USD: { EUR: 0.93 },
};
```

### Améliorations Nécessaires

1. **Ajouter support pour toutes les paires**
   - EUR ↔ USD, GBP, CAD, AED, NGN, GHS, ZAR, XOF
   - USD ↔ EUR, GBP, CAD, AED, NGN, GHS, ZAR, XOF
   - GBP, CAD, etc. ↔ tout le reste
   - Utiliser taux croisés via USD comme pivot

2. **Ajouter interface TypedRate**

   ```typescript
   interface ExchangeRate {
     from: string;
     to: string;
     rate: number;
     timestamp: Date;
     source: "cache" | "api" | "calculated";
   }
   ```

3. **Implémenter cache avec TTL**

   ```typescript
   private rateCache: Map<string, { rate: number; expiry: Date }> = new Map();
   private readonly CACHE_TTL_MS = 3600000; // 1 heure
   ```

4. **Ajouter méthodes**
   - `getMultipleRates(baseCurrency: string): Record<string, number>`
   - `getRate(from, to)` → ajouter logs + validation
   - `convert(amount, from, to)` → ajouter precistion decimal
   - `getSupportedCurrencies(): string[]`
   - `updateRates(newRates)` → pour admin (Phase 2)

5. **Validation**
   - Vérifier devises supportées
   - Gérer cas where rate = null

### Code à Implémenter

**Créer:** `apps/server/src/exchange/interfaces/exchange-rate.interface.ts`

```typescript
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: "cache" | "api" | "calculated";
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}
```

**Modifier:** `apps/server/src/exchange/exchange.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import {
  ExchangeRate,
  ConversionResult,
} from "./interfaces/exchange-rate.interface";

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);

  // Base rates for all supported currencies
  private baseRates: Record<string, Record<string, number>> = {
    EUR: {
      USD: 1.08,
      GBP: 0.86,
      CAD: 1.4,
      AED: 3.98,
      NGN: 1250,
      GHS: 11.2,
      ZAR: 20.5,
      XOF: 655,
    },
    USD: {
      EUR: 0.93,
      GBP: 0.8,
      CAD: 1.3,
      AED: 3.67,
      NGN: 1160,
      GHS: 10.4,
      ZAR: 19.0,
      XOF: 606,
    },
    GBP: {
      EUR: 1.16,
      USD: 1.25,
      CAD: 1.62,
      AED: 4.58,
      NGN: 1450,
      GHS: 12.9,
      ZAR: 23.4,
      XOF: 750,
    },
    CAD: {
      EUR: 0.71,
      USD: 0.77,
      GBP: 0.62,
      AED: 2.83,
      NGN: 892,
      GHS: 7.95,
      ZAR: 14.4,
      XOF: 463,
    },
    AED: {
      EUR: 0.25,
      USD: 0.27,
      GBP: 0.22,
      CAD: 0.35,
      NGN: 314,
      GHS: 2.8,
      ZAR: 5.15,
      XOF: 164,
    },
    NGN: {
      EUR: 0.0008,
      USD: 0.00086,
      GBP: 0.00069,
      CAD: 0.0011,
      AED: 0.0032,
      GHS: 0.0089,
      ZAR: 0.0164,
      XOF: 0.522,
    },
    GHS: {
      EUR: 0.089,
      USD: 0.096,
      GBP: 0.077,
      CAD: 0.126,
      AED: 0.357,
      NGN: 112,
      ZAR: 1.84,
      XOF: 58.5,
    },
    ZAR: {
      EUR: 0.049,
      USD: 0.053,
      GBP: 0.043,
      CAD: 0.069,
      AED: 0.194,
      NGN: 61,
      GHS: 0.54,
      XOF: 31.8,
    },
    XOF: {
      EUR: 0.0015,
      USD: 0.0017,
      GBP: 0.0013,
      CAD: 0.0022,
      AED: 0.0061,
      NGN: 1.92,
      GHS: 0.017,
      ZAR: 0.031,
    },
  };

  // Cache for frequently accessed rates
  private rateCache: Map<string, { rate: number; expiry: Date }> = new Map();
  private readonly CACHE_TTL_MS = 3600000; // 1 hour

  async getRate(from: string, to: string): Promise<number | null> {
    if (from === to) return 1;

    from = from.toUpperCase();
    to = to.toUpperCase();

    const cacheKey = `${from}:${to}`;

    // Check cache
    const cached = this.rateCache.get(cacheKey);
    if (cached && cached.expiry > new Date()) {
      return cached.rate;
    }

    // Get from base rates
    const baseRate = this.baseRates[from]?.[to];
    if (baseRate) {
      this.rateCache.set(cacheKey, {
        rate: baseRate,
        expiry: new Date(Date.now() + this.CACHE_TTL_MS),
      });
      return baseRate;
    }

    // Try reverse rate if available
    const reverseRate = this.baseRates[to]?.[from];
    if (reverseRate) {
      const calculatedRate = 1 / reverseRate;
      this.rateCache.set(cacheKey, {
        rate: calculatedRate,
        expiry: new Date(Date.now() + this.CACHE_TTL_MS),
      });
      return calculatedRate;
    }

    this.logger.warn(`No exchange rate found for ${from} -> ${to}`);
    return null;
  }

  async getMultipleRates(
    baseCurrency: string
  ): Promise<Record<string, number>> {
    const supported = this.getSupportedCurrencies();
    const rates: Record<string, number> = {};

    for (const currency of supported) {
      if (currency !== baseCurrency) {
        const rate = await this.getRate(baseCurrency, currency);
        if (rate) {
          rates[currency] = rate;
        }
      }
    }

    return rates;
  }

  async convert(
    amount: number,
    from: string,
    to: string
  ): Promise<ConversionResult> {
    const rate = await this.getRate(from, to);

    if (!rate) {
      throw new Error(`No exchange rate available for ${from} -> ${to}`);
    }

    const convertedAmount = Math.round(amount * rate * 100) / 100; // 2 decimal places

    return {
      originalAmount: amount,
      convertedAmount,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
      timestamp: new Date(),
    };
  }

  getSupportedCurrencies(): string[] {
    return Object.keys(this.baseRates).sort();
  }

  clearCache(): void {
    this.rateCache.clear();
    this.logger.debug("Exchange rate cache cleared");
  }
}
```

---

## 🎯 Tâche 2: Créer DTOs pour Exchange (15min)

**Créer:** `apps/server/src/exchange/dto/conversion-request.dto.ts`

```typescript
import { IsNumber, IsString, IsPositive, Min, Max } from "class-validator";

export class ConversionRequestDto {
  @IsNumber()
  @IsPositive()
  @Max(999999999)
  amount: number;

  @IsString()
  from: string;

  @IsString()
  to: string;
}
```

**Créer:** `apps/server/src/exchange/dto/conversion-response.dto.ts`

```typescript
export class ConversionResponseDto {
  originalAmount: number;
  convertedAmount: number;
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}
```

---

## 🎯 Tâche 3: Créer LocalizationService (30min)

**Créer:** `apps/server/src/localization/localization.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";

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
      const enMessages = require("./messages/en.messages.json");
      this.messages.set("en", enMessages);
      this.logger.debug("Loaded EN localization messages");
    } catch (e) {
      this.logger.warn("Failed to load EN messages");
    }

    // Load FR messages
    try {
      const frMessages = require("./messages/fr.messages.json");
      this.messages.set("fr", frMessages);
      this.logger.debug("Loaded FR localization messages");
    } catch (e) {
      this.logger.warn("Failed to load FR messages");
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
    locale: string = "en",
    params?: Record<string, string | number>
  ): string {
    const messages = this.messages.get(locale) || this.messages.get("en");
    if (!messages) {
      return key; // Fallback to key itself
    }

    const keys = key.split(".");
    let message: any = messages;

    for (const k of keys) {
      if (typeof message === "object" && message !== null && k in message) {
        message = message[k];
      } else {
        this.logger.warn(
          `Missing localization key: ${key} for locale: ${locale}`
        );
        return key;
      }
    }

    if (typeof message !== "string") {
      return key;
    }

    // Interpolate variables
    if (params) {
      let result = message;
      for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)); // Alternative syntax
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
```

**Créer:** `apps/server/src/localization/localization.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { LocalizationService } from "./localization.service";

@Module({
  providers: [LocalizationService],
  exports: [LocalizationService],
})
export class LocalizationModule {}
```

**Créer:** `apps/server/src/localization/messages/en.messages.json`

```json
{
  "errors": {
    "validation": {
      "email": "Invalid email address",
      "password": "Password must be at least 8 characters",
      "firstName": "First name is required",
      "lastName": "Last name is required",
      "currency": "Currency {currency} is not supported",
      "locale": "Locale {locale} is not supported",
      "amount": "Amount must be a positive number"
    },
    "exchange": {
      "noRate": "No exchange rate available for {from} -> {to}",
      "unsupported": "Currency {currency} is not supported",
      "conversionFailed": "Conversion failed: {error}"
    },
    "auth": {
      "invalidCredentials": "Invalid email or password",
      "userExists": "User with this email already exists",
      "notFound": "User not found"
    },
    "transaction": {
      "insufficientFunds": "Insufficient funds for this transaction",
      "invalidAmount": "Transaction amount must be positive",
      "failed": "Transaction failed: {error}"
    }
  },
  "messages": {
    "success": {
      "registered": "Account created successfully",
      "login": "Logged in successfully",
      "profileUpdated": "Profile updated successfully",
      "transactionCreated": "Transaction created successfully"
    }
  }
}
```

**Créer:** `apps/server/src/localization/messages/fr.messages.json`

```json
{
  "errors": {
    "validation": {
      "email": "Adresse email invalide",
      "password": "Le mot de passe doit contenir au moins 8 caractères",
      "firstName": "Le prénom est requis",
      "lastName": "Le nom est requis",
      "currency": "La devise {currency} n'est pas supportée",
      "locale": "La langue {locale} n'est pas supportée",
      "amount": "Le montant doit être un nombre positif"
    },
    "exchange": {
      "noRate": "Aucun taux de change disponible pour {from} -> {to}",
      "unsupported": "La devise {currency} n'est pas supportée",
      "conversionFailed": "La conversion a échoué : {error}"
    },
    "auth": {
      "invalidCredentials": "Email ou mot de passe invalide",
      "userExists": "Un utilisateur avec cet email existe déjà",
      "notFound": "Utilisateur non trouvé"
    },
    "transaction": {
      "insufficientFunds": "Fonds insuffisants pour cette transaction",
      "invalidAmount": "Le montant doit être positif",
      "failed": "La transaction a échoué : {error}"
    }
  },
  "messages": {
    "success": {
      "registered": "Compte créé avec succès",
      "login": "Connexion réussie",
      "profileUpdated": "Profil mis à jour avec succès",
      "transactionCreated": "Transaction créée avec succès"
    }
  }
}
```

---

## 🎯 Tâche 4: Créer Formatters (45min)

**Créer:** `apps/server/src/localization/formatters/currency.formatter.ts`

```typescript
import { Injectable } from "@nestjs/common";

@Injectable()
export class CurrencyFormatter {
  private readonly currencySymbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CAD: "$",
    AED: "د.إ",
    NGN: "₦",
    GHS: "₵",
    ZAR: "R",
    XOF: "CFA",
  };

  private readonly currencyPositions: Record<string, "before" | "after"> = {
    EUR: "after",
    USD: "before",
    GBP: "before",
    CAD: "before",
    AED: "before",
    NGN: "before",
    GHS: "before",
    ZAR: "before",
    XOF: "after",
  };

  formatCurrency(
    amount: number,
    currency: string,
    locale: string = "en-US"
  ): string {
    const symbol = this.currencySymbols[currency] || currency;
    const position = this.currencyPositions[currency] || "before";

    const formatted = new Intl.NumberFormat(this.mapLocale(locale), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    if (position === "before") {
      return `${symbol} ${formatted}`;
    } else {
      return `${formatted} ${symbol}`;
    }
  }

  private mapLocale(locale: string): string {
    // Map common locales to Intl-compatible ones
    const mapping: Record<string, string> = {
      "en-US": "en-US",
      "en-GB": "en-GB",
      "fr-FR": "fr-FR",
      "fr-CA": "fr-CA",
      "ar-AE": "ar-AE",
      "pt-PT": "pt-PT",
      "sw-KE": "sw-KE",
    };
    return mapping[locale] || "en-US";
  }
}
```

**Créer:** `apps/server/src/localization/formatters/date.formatter.ts`

```typescript
import { Injectable } from "@nestjs/common";

@Injectable()
export class DateFormatter {
  formatDate(
    date: Date | string,
    locale: string = "en-US",
    format: "short" | "long" | "full" = "long"
  ): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions = {
      short: { year: "2-digit", month: "2-digit", day: "2-digit" },
      long: { year: "numeric", month: "long", day: "numeric" },
      full: { year: "numeric", month: "long", day: "numeric", weekday: "long" },
    };

    return new Intl.DateTimeFormat(
      this.mapLocale(locale),
      options[format]
    ).format(dateObj);
  }

  formatTime(date: Date | string, locale: string = "en-US"): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    return new Intl.DateTimeFormat(this.mapLocale(locale), {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(dateObj);
  }

  private mapLocale(locale: string): string {
    const mapping: Record<string, string> = {
      "en-US": "en-US",
      "en-GB": "en-GB",
      "fr-FR": "fr-FR",
      "fr-CA": "fr-CA",
    };
    return mapping[locale] || "en-US";
  }
}
```

**Créer:** `apps/server/src/localization/formatters/number.formatter.ts`

```typescript
import { Injectable } from "@nestjs/common";

@Injectable()
export class NumberFormatter {
  formatNumber(
    value: number,
    locale: string = "en-US",
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      useGrouping?: boolean;
    }
  ): string {
    const opts: Intl.NumberFormatOptions = {
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      useGrouping: options?.useGrouping ?? true,
    };

    return new Intl.NumberFormat(this.mapLocale(locale), opts).format(value);
  }

  formatPercent(
    value: number,
    locale: string = "en-US",
    decimalPlaces: number = 2
  ): string {
    const formatted = new Intl.NumberFormat(this.mapLocale(locale), {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);

    return `${formatted}%`;
  }

  private mapLocale(locale: string): string {
    const mapping: Record<string, string> = {
      "en-US": "en-US",
      "en-GB": "en-GB",
      "fr-FR": "fr-FR",
      "fr-CA": "fr-CA",
    };
    return mapping[locale] || "en-US";
  }
}
```

---

## 🎯 Tâche 5: Améliorer Exchange Controller (15min)

**Modifier:** `apps/server/src/exchange/exchange.controller.ts`

Ajouter ces endpoints:

```typescript
import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ExchangeService } from "./exchange.service";
import { ConversionRequestDto } from "./dto/conversion-request.dto";
import { ConversionResponseDto } from "./dto/conversion-response.dto";

@Controller("exchange")
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * GET /exchange/rates?base=EUR
   * Get all supported rates for a base currency
   */
  @Get("rates")
  async getRates(
    @Query("base") baseCurrency: string = "EUR"
  ): Promise<Record<string, number>> {
    return this.exchangeService.getMultipleRates(baseCurrency);
  }

  /**
   * POST /exchange/convert
   * Convert amount from one currency to another
   */
  @Post("convert")
  async convert(
    @Body() request: ConversionRequestDto
  ): Promise<ConversionResponseDto> {
    const result = await this.exchangeService.convert(
      request.amount,
      request.from,
      request.to
    );
    return result;
  }

  /**
   * GET /exchange/supported-currencies
   * Get list of all supported currencies
   */
  @Get("supported-currencies")
  async getSupportedCurrencies(): Promise<string[]> {
    return this.exchangeService.getSupportedCurrencies();
  }

  /**
   * GET /exchange/rate/:from/:to
   * Get specific rate between two currencies
   */
  @Get("rate/:from/:to")
  async getRate(
    @Param("from") from: string,
    @Param("to") to: string
  ): Promise<{ from: string; to: string; rate: number }> {
    const rate = await this.exchangeService.getRate(from, to);
    if (!rate) {
      throw new Error(`No rate available for ${from} -> ${to}`);
    }
    return { from: from.toUpperCase(), to: to.toUpperCase(), rate };
  }
}
```

---

## 🎯 Tâche 6: Mettre à jour App Module (10min)

**Modifier:** `apps/server/src/app.module.ts`

Ajouter `LocalizationModule`:

```typescript
import { LocalizationModule } from "./localization/localization.module";

@Module({
  imports: [
    // ... existing imports
    LocalizationModule,
  ],
})
export class AppModule {}
```

---

## 📋 Checklist Phase 1

- [ ] ✅ ExchangeService amélioré (taux complets, cache, validation)
- [ ] ✅ ConversionRequestDto créé
- [ ] ✅ ConversionResponseDto créé
- [ ] ✅ ExchangeRate interface créé
- [ ] ✅ LocalizationService créé (en + fr messages)
- [ ] ✅ LocalizationModule créé et importé
- [ ] ✅ CurrencyFormatter créé
- [ ] ✅ DateFormatter créé
- [ ] ✅ NumberFormatter créé
- [ ] ✅ ExchangeController endpoints ajoutés
- [ ] ✅ App.module.ts mis à jour
- [ ] ✅ Tests unitaires pour formatters
- [ ] ✅ Tests API pour exchange endpoints

---

## 🧪 Tests Phase 1

### Test ExchangeService

```bash
npm run test -- exchange.service
```

Vérifier:

- ✅ Conversion EUR → USD = correct
- ✅ Conversion USD → EUR = correct (inverse)
- ✅ Même devise → taux = 1
- ✅ Devise non supportée → null
- ✅ Cache fonctionne (2e appel retourne de cache)

### Test API

```bash
curl -X POST http://localhost:3000/exchange/convert \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "from": "EUR", "to": "USD"}'
```

Response attendu:

```json
{
  "originalAmount": 100,
  "convertedAmount": 108,
  "from": "EUR",
  "to": "USD",
  "rate": 1.08,
  "timestamp": "2025-12-06T..."
}
```

---

## ⚠️ Dépendances Externes

- `class-validator` (déjà installé?)
- `class-transformer` (déjà installé?)

Vérifier avec:

```bash
npm ls class-validator class-transformer
```

Si manquant:

```bash
npm install class-validator class-transformer
```

---

## 🚀 Après Phase 1

Une fois Phase 1 complète:

- ✅ Backend prêt avec tous les endpoints
- ✅ Formatters prêts pour convertir/formatter
- ✅ LocalizationService prêt pour traductions
- → **Passer à Phase 2: Frontend Infrastructure (i18n)**
