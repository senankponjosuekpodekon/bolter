# Sprint I - Phase 2: Frontend Infrastructure Guide 📱

**Objectif:** Construire infrastructure i18n frontend et créer traductions complètes  
**Durée estimée:** 2h 45min  
**Date de démarrage:** Après Phase 1 ✅

---

## 📋 Vue d'ensemble Phase 2

### Fichiers à créer/modifier:

```
apps/client/src/
├── i18n.ts                          [AMÉLIORER]
├── locales/
│   ├── en/
│   │   ├── common.json              [COMPLÉTER - déjà existant]
│   │   ├── transactions.json        [CRÉER]
│   │   ├── kyc.json                 [CRÉER]
│   │   ├── admin.json               [CRÉER]
│   │   └── errors.json              [CRÉER]
│   └── fr/
│       ├── common.json              [CRÉER]
│       ├── transactions.json        [CRÉER]
│       ├── kyc.json                 [CRÉER]
│       ├── admin.json               [CRÉER]
│       └── errors.json              [CRÉER]
│
├── hooks/
│   ├── useCurrency.ts               [CRÉER]
│   ├── useLocalization.ts           [CRÉER]
│   ├── useExchange.ts               [CRÉER]
│   └── useFormatting.ts             [CRÉER]
│
├── services/
│   ├── currencyService.ts           [CRÉER]
│   ├── localizationService.ts       [CRÉER]
│   └── exchangeService.ts           [CRÉER - wrapper API]
│
└── utils/
    ├── formatters/
    │   ├── currencyFormatter.ts     [CRÉER]
    │   ├── dateFormatter.ts         [CRÉER]
    │   ├── numberFormatter.ts       [CRÉER]
    │   └── percentFormatter.ts      [CRÉER]
    └── converters/
        └── currencyConverter.ts     [CRÉER]
```

---

## 🎯 Tâche 1: Améliorer i18n Configuration (45min)

### État Actuel

```typescript
// apps/client/src/i18n.ts
// Lazy loading est déjà implémenté
// BUT: Peut être amélioré avec:
// - Meilleure détection de langue (browser → localStorage → URL → default)
// - Support namespaces
// - Meilleur fallback
```

### Améliorations à Faire

1. **Ajouter support namespaces**

   ```typescript
   // Actuellement: common.json
   // Ajouter: common.json, transactions.json, kyc.json, admin.json, errors.json
   i18n.addResourceBundle("en", "transactions", en_transactions);
   i18n.addResourceBundle("en", "kyc", en_kyc);
   ```

2. **Améliorer détection de langue**

   ```typescript
   // Ordre de priorité:
   // 1. localStorage (utilisateur a changé)
   // 2. URL query parameter (?lng=fr)
   // 3. localStorage du navigateur (browser lang)
   // 4. Default: en-US
   ```

3. **Ajouter formatters locales**
   ```typescript
   i18n.init({
     ...,
     interpolation: {
       escapeValue: false,
       format: (value, format, lng) => {
         // Custom format function pour dates, nombres, etc.
       }
     }
   })
   ```

### Code à Implémenter

**Modifier:** `apps/client/src/i18n.ts`

```typescript
import i18n from "i18next";
import type { Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Default language bundles (bundled with app)
import en_common from "./locales/en/common.json";
import en_transactions from "./locales/en/transactions.json";
import en_kyc from "./locales/en/kyc.json";
import en_admin from "./locales/en/admin.json";
import en_errors from "./locales/en/errors.json";

// Keep default locale bundled, others lazy-loaded
const resources: Resource = {
  "en-US": {
    common: en_common,
    transactions: en_transactions,
    kyc: en_kyc,
    admin: en_admin,
    errors: en_errors,
  },
};

/**
 * Dynamically load a locale bundle
 * Supports both 'fr' and 'fr-FR' format
 */
async function loadLocale(locale: string) {
  // Normalize locale (fr-FR -> fr)
  const langCode = locale.split("-")[0];

  // Check if already loaded
  if (i18n.hasResourceBundle(langCode, "common")) {
    return Promise.resolve();
  }

  try {
    // Load all namespaces for the locale
    const [common, transactions, kyc, admin, errors] = await Promise.all([
      import(`./locales/${langCode}/common.json`),
      import(`./locales/${langCode}/transactions.json`),
      import(`./locales/${langCode}/kyc.json`),
      import(`./locales/${langCode}/admin.json`),
      import(`./locales/${langCode}/errors.json`),
    ]);

    // Add resources for this locale
    i18n.addResourceBundle(langCode, "common", common.default, true, true);
    i18n.addResourceBundle(
      langCode,
      "transactions",
      transactions.default,
      true,
      true
    );
    i18n.addResourceBundle(langCode, "kyc", kyc.default, true, true);
    i18n.addResourceBundle(langCode, "admin", admin.default, true, true);
    i18n.addResourceBundle(langCode, "errors", errors.default, true, true);

    console.log(`Loaded locale: ${langCode}`);
  } catch (err) {
    console.warn(`Failed to load locale ${langCode}:`, err);
    // Fallback to EN will happen automatically via fallbackLng
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    fallbackNS: "common",
    defaultNS: "common",
    ns: ["common", "transactions", "kyc", "admin", "errors"],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

export { loadLocale };
export default i18n;
```

---

## 🎯 Tâche 2: Créer Fichiers Traduction EN (60min)

### Structure à Créer

**Créer:** `apps/client/src/locales/en/transactions.json`

```json
{
  "transactions": {
    "title": "Transactions",
    "new": "New Transaction",
    "history": "Transaction History",
    "close": "Close",
    "types": {
      "transfer": "Transfer",
      "deposit": "Deposit",
      "withdraw": "Withdrawal"
    },
    "labels": {
      "date": "Date",
      "type": "Type",
      "description": "Description",
      "amount": "Amount",
      "originalAmount": "Original Amount",
      "currency": "Currency",
      "rate": "Exchange Rate",
      "status": "Status",
      "from": "From",
      "to": "To"
    },
    "statuses": {
      "pending": "Pending",
      "approved": "Approved",
      "rejected": "Rejected",
      "failed": "Failed",
      "completed": "Completed"
    },
    "messages": {
      "helper_transfer": "Transfers will be queued for review and approval.",
      "helper_deposit": "Deposits will be queued for review and approval.",
      "helper_withdraw": "Withdrawals will be queued for review and approval.",
      "success_created": "{{type}} created successfully",
      "error_create": "Unable to create {{type}}"
    }
  }
}
```

**Créer:** `apps/client/src/locales/en/kyc.json`

```json
{
  "kyc": {
    "title": "KYC Verification",
    "subtitle": "Complete your identity verification",
    "status": "KYC Status",
    "documents": "Documents",
    "labels": {
      "firstName": "First Name",
      "lastName": "Last Name",
      "dateOfBirth": "Date of Birth",
      "nationality": "Nationality",
      "documentType": "Document Type",
      "documentNumber": "Document Number",
      "issueDate": "Issue Date",
      "expiryDate": "Expiry Date",
      "address": "Address",
      "city": "City",
      "state": "State",
      "postalCode": "Postal Code",
      "country": "Country"
    },
    "documentTypes": {
      "id_card": "National ID Card",
      "passport": "Passport",
      "driving_license": "Driver's License",
      "proof_address": "Proof of Address"
    },
    "statuses": {
      "pending": "Pending Review",
      "approved": "Approved",
      "rejected": "Rejected",
      "expired": "Expired"
    },
    "messages": {
      "upload": "Upload Document",
      "uploading": "Uploading...",
      "success": "Document uploaded successfully",
      "error": "Failed to upload document",
      "verify": "Verify Identity",
      "verified": "Verified"
    }
  }
}
```

**Créer:** `apps/client/src/locales/en/admin.json`

```json
{
  "admin": {
    "title": "Admin Dashboard",
    "dashboard": "Dashboard",
    "stats": "Statistics",
    "alerts": "Alerts",
    "users": "Users",
    "transactions": "Transactions",
    "kyc": "KYC Documents",
    "settings": "Settings",
    "labels": {
      "totalUsers": "Total Users",
      "activeTransactions": "Active Transactions",
      "pendingKyc": "Pending KYC",
      "successRate": "Success Rate",
      "averageAmount": "Average Amount",
      "riskScore": "Risk Score"
    },
    "alerts": {
      "overdueKyc": "{{count}} KYC documents pending review",
      "fraudRisk": "High fraud risk detected",
      "largeTransaction": "Large transaction detected"
    },
    "bulk": {
      "title": "Bulk Operations",
      "selectAction": "Select Action",
      "approve": "Approve",
      "reject": "Reject",
      "delete": "Delete",
      "reason": "Reason",
      "processing": "Processing...",
      "success": "Operation completed"
    },
    "exchange": {
      "title": "Exchange Rates",
      "rates": "Current Rates",
      "base": "Base Currency",
      "updateRates": "Update Rates",
      "lastUpdated": "Last Updated"
    }
  }
}
```

**Créer:** `apps/client/src/locales/en/errors.json`

```json
{
  "errors": {
    "validation": {
      "required": "{{field}} is required",
      "email": "Invalid email address",
      "password": "Password must be at least 8 characters",
      "amount": "Amount must be positive",
      "currency": "Invalid currency",
      "locale": "Unsupported language"
    },
    "auth": {
      "invalidCredentials": "Invalid email or password",
      "notLoggedIn": "Please log in first",
      "unauthorized": "You do not have permission",
      "sessionExpired": "Your session has expired"
    },
    "transaction": {
      "insufficientFunds": "Insufficient funds",
      "invalidAmount": "Invalid amount",
      "failed": "Transaction failed"
    },
    "kyc": {
      "invalidDocument": "Invalid document",
      "uploadFailed": "Upload failed",
      "verificationFailed": "Verification failed"
    },
    "network": {
      "offline": "You are offline",
      "timeout": "Request timeout",
      "error": "An error occurred"
    }
  }
}
```

**Modifier:** `apps/client/src/locales/en/common.json`

- Ajouter nouvelles clés si manquantes
- Assurer cohérence avec Backend messages
- Garder existants intacts

---

## 🎯 Tâche 3: Créer Fichiers Traduction FR (75min)

Même structure que EN, mais en français!

**Créer:** `apps/client/src/locales/fr/transactions.json`

```json
{
  "transactions": {
    "title": "Transactions",
    "new": "Nouvelle Transaction",
    "history": "Historique des Transactions",
    "close": "Fermer",
    "types": {
      "transfer": "Virement",
      "deposit": "Dépôt",
      "withdraw": "Retrait"
    },
    "labels": {
      "date": "Date",
      "type": "Type",
      "description": "Description",
      "amount": "Montant",
      "originalAmount": "Montant Original",
      "currency": "Devise",
      "rate": "Taux de Change",
      "status": "Statut",
      "from": "De",
      "to": "À"
    },
    "statuses": {
      "pending": "En attente",
      "approved": "Approuvé",
      "rejected": "Rejeté",
      "failed": "Échoué",
      "completed": "Complété"
    },
    "messages": {
      "helper_transfer": "Les virements seront mises en queue pour examen et approbation.",
      "helper_deposit": "Les dépôts seront mis en queue pour examen et approbation.",
      "helper_withdraw": "Les retraits seront mis en queue pour examen et approbation.",
      "success_created": "{{type}} créé avec succès",
      "error_create": "Impossible de créer {{type}}"
    }
  }
}
```

**À suivre:** Créer kyc.json, admin.json, errors.json, common.json pour FR

---

## 🎯 Tâche 4: Créer Frontend Formatters (45min)

**Créer:** `apps/client/src/utils/formatters/currencyFormatter.ts`

```typescript
import { CurrencyFormatter as BackendFormatter } from "../services/localizationService";

const backendFormatter = new BackendFormatter();

/**
 * Format currency amount with exchange rate conversion
 * @param amount Original amount
 * @param fromCurrency Original currency
 * @param toCurrency Target currency (user preference)
 * @param exchangeRate Rate to apply
 * @param locale User locale for formatting
 */
export function formatCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency?: string,
  exchangeRate?: number,
  locale: string = "en-US"
): string {
  const currency = toCurrency || fromCurrency;
  return backendFormatter.formatCurrency(amount, currency, locale);
}

/**
 * Format with original and converted amounts
 */
export function formatCurrencyPair(
  originalAmount: number,
  originalCurrency: string,
  convertedAmount: number,
  targetCurrency: string,
  locale: string = "en-US"
): string {
  const original = formatCurrency(
    originalAmount,
    originalCurrency,
    originalCurrency,
    1,
    locale
  );
  const converted = formatCurrency(
    convertedAmount,
    targetCurrency,
    targetCurrency,
    1,
    locale
  );
  return `${original} → ${converted}`;
}

export default {
  formatCurrency,
  formatCurrencyPair,
};
```

**Créer:** `apps/client/src/utils/formatters/dateFormatter.ts`

```typescript
/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-US",
  format: "short" | "long" = "long"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const options: Record<"short" | "long", Intl.DateTimeFormatOptions> = {
    short: { year: "2-digit", month: "2-digit", day: "2-digit" },
    long: { year: "numeric", month: "long", day: "numeric" },
  };

  return new Intl.DateTimeFormat(
    normalizeLocale(locale),
    options[format]
  ).format(dateObj);
}

/**
 * Format time HH:MM:SS
 */
export function formatTime(
  date: Date | string,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(dateObj);
}

function normalizeLocale(locale: string): string {
  const mapping: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    "en-US": "en-US",
    "en-GB": "en-GB",
    "fr-FR": "fr-FR",
    "fr-CA": "fr-CA",
  };
  return mapping[locale] || "en-US";
}

export default {
  formatDate,
  formatTime,
};
```

**Créer:** `apps/client/src/utils/formatters/numberFormatter.ts`

```typescript
/**
 * Format number with locale-specific separators
 */
export function formatNumber(
  value: number,
  locale: string = "en-US",
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const opts: Intl.NumberFormatOptions = {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  };

  return new Intl.NumberFormat(normalizeLocale(locale), opts).format(value);
}

function normalizeLocale(locale: string): string {
  const mapping: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    "en-US": "en-US",
    "fr-FR": "fr-FR",
  };
  return mapping[locale] || "en-US";
}

export default {
  formatNumber,
};
```

---

## 🎯 Tâche 5: Créer Custom Hooks (30min)

**Créer:** `apps/client/src/hooks/useCurrency.ts`

```typescript
import { useCallback } from "react";
import { useAuth } from "./useAuth"; // Existing hook
import exchangeService from "../services/exchangeService";

export function useCurrency() {
  const { user } = useAuth();
  const userCurrency = user?.currency || "EUR";
  const userLocale = user?.locale || "en-US";

  const convertAmount = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      return exchangeService.convert(amount, fromCurrency, toCurrency);
    },
    []
  );

  return {
    userCurrency,
    userLocale,
    convertAmount,
  };
}
```

**Créer:** `apps/client/src/hooks/useLocalization.ts`

```typescript
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { loadLocale } from "../i18n";

export function useLocalization() {
  const { t, i18n } = useTranslation();

  const changeLanguage = useCallback(
    async (locale: string) => {
      await loadLocale(locale);
      await i18n.changeLanguage(locale);
    },
    [i18n]
  );

  return {
    t,
    locale: i18n.language,
    changeLanguage,
    supportedLocales: ["en-US", "fr-FR"],
  };
}
```

**Créer:** `apps/client/src/hooks/useExchange.ts`

```typescript
import { useState, useCallback } from "react";
import exchangeService from "../services/exchangeService";

export function useExchange() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);

  const getRates = useCallback(async (baseCurrency: string) => {
    setLoading(true);
    try {
      const result = await exchangeService.getRates(baseCurrency);
      setRates(result);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rates,
    loading,
    getRates,
  };
}
```

---

## 📋 Checklist Phase 2

- [ ] Améliorer i18n configuration (namespaces, detection)
- [ ] Créer 5 fichiers EN (common, transactions, kyc, admin, errors)
- [ ] Créer 5 fichiers FR (common, transactions, kyc, admin, errors)
- [ ] Créer 4 formatters frontend (currency, date, number, percent)
- [ ] Créer 4 custom hooks (useCurrency, useLocalization, useExchange, useFormatting)
- [ ] Tester chargement locale dynamique
- [ ] Vérifier formatage dates/nombres corrects
- [ ] Vérifier interpolation variables ({{variable}})
- [ ] Tests pour hooks + formatters

---

## 🚀 Après Phase 2

Une fois Phase 2 complète:

- ✅ i18n configuré avec 5 namespaces
- ✅ Traductions EN + FR (250+ clés)
- ✅ Formatters frontend prêts
- ✅ Hooks custom pour usage facile
- → **Passer à Phase 3: Composants & UI (CurrencyDisplay, LanguageSwitcher, etc.)**
