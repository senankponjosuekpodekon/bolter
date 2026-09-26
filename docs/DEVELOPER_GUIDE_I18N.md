# Sprint I: Developer Guide - Adding i18n to New Components

**Date:** 6 décembre 2025  
**Version:** 1.0  
**Audience:** Development Team

---

## Quick Start: 5-Step Integration

Adding multi-language support to a new React component takes **< 5 minutes**:

```typescript
// Step 1: Import hooks
import { useTranslation } from "react-i18next"
import { useFormatting, useLocalization } from "../hooks"

// Step 2: Use in component
export function MyComponent() {
  const { t } = useTranslation("namespace")
  const { currency, date } = useFormatting()
  const { changeLanguage } = useLocalization()

  // Step 3: Use in JSX
  return (
    <>
      <h1>{t("key.title")}</h1>
      <p>{t("key.description")}</p>
      <span>{currency.format(100, "EUR")}</span>
      <span>{date.format(new Date(), "long")}</span>
      <button onClick={() => changeLanguage("fr-FR")}>
        {t("labels.french")}
      </button>
    </>
  )
}

// Step 4: Add translation keys to locales/en/namespace.json
// Step 5: Add French translations to locales/fr/namespace.json
```

---

## Table of Contents

1. [Translation Keys](#translation-keys)
2. [Using Formatters](#using-formatters)
3. [Using Localization Hook](#using-localization-hook)
4. [Adding New Namespaces](#adding-new-namespaces)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Translation Keys

### Basic Usage

```typescript
import { useTranslation } from "react-i18next"

export function MyComponent() {
  const { t } = useTranslation("common")

  return <h1>{t("page.title")}</h1>
}
```

### Key Translation File Structure

**locales/en/common.json:**

```json
{
  "page": {
    "title": "Welcome",
    "subtitle": "Get started with our app"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "labels": {
    "email": "Email Address",
    "password": "Password"
  }
}
```

**locales/fr/common.json:**

```json
{
  "page": {
    "title": "Bienvenue",
    "subtitle": "Commencez avec notre application"
  },
  "buttons": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "labels": {
    "email": "Adresse E-mail",
    "password": "Mot de passe"
  }
}
```

### Accessing Translation Keys

```typescript
// Nested access
t("page.title"); // "Welcome"

// Array access
t("labels.email"); // "Email Address"

// Fallback
t("missing.key"); // Returns the key itself as fallback
```

### Interpolation (Dynamic Values)

**Translation file:**

```json
{
  "greeting": "Hello {{name}}, welcome back!"
}
```

**In component:**

```typescript
t("greeting", { name: "Alice" });
// Result: "Hello Alice, welcome back!"
```

### Pluralization

**Translation file:**

```json
{
  "items": "You have {{count}} item",
  "items_plural": "You have {{count}} items"
}
```

**In component:**

```typescript
t("items", { count: 1 }); // "You have 1 item"
t("items", { count: 5 }); // "You have 5 items"
```

---

## Using Formatters

### Currency Formatter

**Usage:**

```typescript
import { useFormatting } from "../hooks"

export function MyComponent() {
  const { currency } = useFormatting()

  return (
    <div>
      <p>{currency.format(1234.56, "EUR")}</p>
      {/* Output: 1 234,56 € (FR) or €1,234.56 (EN) */}

      <p>{currency.format(100, "USD")}</p>
      {/* Output: $100 (EN) or 100 $ (FR) */}
    </div>
  )
}
```

**Signature:**

```typescript
currency.format(amount: number, currencyCode: string): string
```

**Supported Currencies:**

- EUR, USD, CAD, AED, NGN, GHS, ZAR, XOF

### Date Formatter

**Usage:**

```typescript
const { date } = useFormatting();

// Short format: "12/06/2025" (EN) or "06/12/2025" (FR)
date.format(new Date(), "short");

// Long format: "December 6, 2025" or "6 décembre 2025"
date.format(new Date(), "long");

// Full format with weekday: "Saturday, December 6, 2025"
date.format(new Date(), "full");
```

**Signature:**

```typescript
date.format(dateObj: Date, format: "short" | "long" | "full"): string
```

### Number Formatter

**Usage:**

```typescript
const { number } = useFormatting();

number.format(1234.56); // "1,234.56" (EN)
number.format(1234.56, { compact: true }); // "1.2K" (EN)
number.format(1234.56, { verbose: true }); // "One thousand two hundred..."
```

**Signature:**

```typescript
number.format(value: number, options?: NumberFormatOptions): string
```

### Percent Formatter

**Usage:**

```typescript
const { percent } = useFormatting();

percent.format(0.15); // "15%" (percent)
percent.format(0.15, "decimal"); // "0.15"
percent.format(0.15, "point"); // "15 pp"
```

**Signature:**

```typescript
percent.format(value: number, style?: "percent" | "decimal" | "point"): string
```

---

## Using Localization Hook

### Get Current Locale

```typescript
import { useLocalization } from "../hooks"

export function MyComponent() {
  const { locale } = useLocalization()

  return <p>Current locale: {locale}</p>
  // Output: "Current locale: en-US"
}
```

### Change Language Programmatically

```typescript
const { changeLanguage } = useLocalization()

// Change to French
await changeLanguage("fr-FR")

// In a button click
<button onClick={() => changeLanguage("fr-FR")}>
  Change to French
</button>
```

### Get Locale Display Name

```typescript
const { getLocaleName } = useLocalization();

getLocaleName("fr-FR"); // "Français (France)"
getLocaleName("en-US"); // "English (US)"
```

### Combined Usage

```typescript
export function LanguageSwitcher() {
  const { locale, changeLanguage } = useLocalization()

  const languages = [
    { code: "en-US", name: "English" },
    { code: "fr-FR", name: "Français" },
    { code: "ar-AE", name: "العربية" }
  ]

  return (
    <select value={locale} onChange={(e) => changeLanguage(e.target.value)}>
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  )
}
```

---

## Adding New Namespaces

### When to Create a Namespace

Create a new namespace for:

- ✅ Feature-specific translations (e.g., "kyc", "transactions")
- ✅ Admin-only translations (e.g., "admin")
- ✅ Large feature areas (100+ keys)

Use "common" for:

- ✅ Shared UI elements (buttons, labels, errors)
- ✅ Small sets of keys (< 50)

### Create New Namespace: Step-by-Step

**1. Create translation files:**

```
locales/
├── en/
│   ├── common.json
│   ├── myfeature.json      ← NEW
│   └── ...
└── fr/
    ├── common.json
    ├── myfeature.json      ← NEW
    └── ...
```

**2. Add namespace to i18n config:**

```typescript
// src/i18n.ts
import enMyFeature from "./locales/en/myfeature.json";
import frMyFeature from "./locales/fr/myfeature.json";

i18n.addResourceBundle("en-US", "myfeature", enMyFeature, true, true);
i18n.addResourceBundle("fr-FR", "myfeature", frMyFeature, true, true);
// ... repeat for other locales
```

**3. Use in component:**

```typescript
const { t } = useTranslation("myfeature");
```

### Example: KYC Namespace

**locales/en/kyc.json:**

```json
{
  "documents": {
    "title": "KYC Documents",
    "instructions": "Please upload the following documents...",
    "types": {
      "id_card": "Identity Document",
      "selfie": "Selfie Verification",
      "proof_address": "Proof of Address"
    }
  },
  "status": {
    "approved": "Approved",
    "pending": "Pending Review",
    "rejected": "Rejected"
  }
}
```

**locales/fr/kyc.json:**

```json
{
  "documents": {
    "title": "Documents KYC",
    "instructions": "Veuillez télécharger les documents suivants...",
    "types": {
      "id_card": "Document d'Identité",
      "selfie": "Vérification Selfie",
      "proof_address": "Justificatif de Domicile"
    }
  },
  "status": {
    "approved": "Approuvé",
    "pending": "En Attente de Vérification",
    "rejected": "Rejeté"
  }
}
```

---

## Best Practices

### 1. Always Use Translation Keys (Never Hardcode)

❌ **Bad:**

```typescript
<h1>Welcome to our app</h1>
<p>Please fill in your details</p>
```

✅ **Good:**

```typescript
const { t } = useTranslation("common")
<h1>{t("page.title")}</h1>
<p>{t("page.subtitle")}</p>
```

### 2. Use Consistent Key Naming

✅ **Good:**

```json
{
  "page": {
    "title": "...",
    "subtitle": "..."
  },
  "buttons": {
    "save": "...",
    "cancel": "..."
  }
}
```

❌ **Bad:**

```json
{
  "pageTitle": "...",
  "pageSubtitle": "...",
  "btn_save": "...",
  "cancelBtn": "..."
}
```

### 3. Use Formatters for All Numbers/Dates

❌ **Bad:**

```typescript
new Date().toLocaleDateString();
formatCurrency(amount, currency, locale);
```

✅ **Good:**

```typescript
const { date, currency } = useFormatting();
date.format(new Date(), "short");
currency.format(amount, currency);
```

### 4. Provide Context in Translation Keys

✅ **Good:**

```json
{
  "transaction": {
    "sent": "Transfer Sent",
    "received": "Transfer Received"
  }
}
```

❌ **Bad:**

```json
{
  "sent": "Sent",
  "received": "Received"
}
```

### 5. Group Related Keys

✅ **Good:**

```json
{
  "account": {
    "balance": "Account Balance",
    "limit": "Account Limit",
    "status": "Account Status"
  }
}
```

❌ **Bad:**

```json
{
  "accountBalance": "Account Balance",
  "limitAmount": "Account Limit",
  "accountStatus": "Account Status"
}
```

### 6. Use Interpolation for Dynamic Content

✅ **Good:**

```typescript
t("greeting", { name: user.name });
// "Hello {{name}}, welcome back!"
```

❌ **Bad:**

```typescript
t("greeting") + " " + user.name; // String concatenation
```

### 7. Keep Formatters in Component Scope

✅ **Good:**

```typescript
export function MyComponent({ user }) {
  const { currency } = useFormatting({ locale: user?.locale })
  return <p>{currency.format(amount, user?.currency)}</p>
}
```

❌ **Bad:**

```typescript
const { currency } = useFormatting(); // At module level
```

### 8. Test All Locales

When adding a new key:

1. Add to all language files (not just English)
2. Test in at least 2 locales
3. Verify date/number formatting in target locale

---

## Common Patterns

### Pattern 1: Dynamic Dropdown with Translations

```typescript
export function CurrencySelector() {
  const { t } = useTranslation("common")
  const { currency } = useFormatting()

  const currencies = ["EUR", "USD", "CAD"]

  return (
    <select>
      {currencies.map(curr => (
        <option key={curr} value={curr}>
          {curr} - {currency.format(100, curr)}
        </option>
      ))}
    </select>
  )
}
```

### Pattern 2: Conditional Translations

```typescript
export function TransactionStatus({ status }) {
  const { t } = useTranslation("transactions")

  return (
    <span className={status === "completed" ? "text-green" : "text-yellow"}>
      {t(`status.${status.toLowerCase()}`)}
    </span>
  )
}
```

### Pattern 3: Table with Localized Headers and Dates

```typescript
export function TransactionTable({ transactions }) {
  const { t } = useTranslation("transactions")
  const { date, currency } = useFormatting()

  return (
    <table>
      <thead>
        <tr>
          <th>{t("table.headers.date")}</th>
          <th>{t("table.headers.amount")}</th>
          <th>{t("table.headers.status")}</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(tx => (
          <tr key={tx.id}>
            <td>{date.format(new Date(tx.date), "short")}</td>
            <td>{currency.format(tx.amount, tx.currency)}</td>
            <td>{t(`status.${tx.status}`)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Pattern 4: Form Validation Errors (Using Errors Namespace)

```typescript
export function MyForm() {
  const { t } = useTranslation(["common", "errors"])
  const [errors, setErrors] = useState({})

  const validate = (data) => {
    const newErrors = {}

    if (!data.email) {
      newErrors.email = t("errors.validation.required_field")
    }
    if (!data.email.includes("@")) {
      newErrors.email = t("errors.validation.invalid_email")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return (
    <form>
      <input type="email" />
      {errors.email && <p className="error">{errors.email}</p>}
    </form>
  )
}
```

### Pattern 5: Language-Aware Formatting in Lists

```typescript
export function AccountList({ accounts }) {
  const { currency, number } = useFormatting()

  return (
    <ul>
      {accounts.map(account => (
        <li key={account.id}>
          <strong>{account.type}</strong>
          <p>Balance: {currency.format(account.balance, account.currency)}</p>
          <p>Transactions: {number.format(account.tx_count)}</p>
        </li>
      ))}
    </ul>
  )
}
```

---

## Testing

### Unit Test: Translation Keys

```typescript
import { useTranslation } from "react-i18next";

test("should display translated text", () => {
  const { t } = useTranslation("common");

  expect(t("page.title")).toBe("Welcome");
  expect(t("buttons.save")).toBe("Save");
});
```

### Unit Test: Formatters

```typescript
import { renderHook } from "@testing-library/react";
import { useFormatting } from "../hooks";

test("should format currency correctly", () => {
  const { result } = renderHook(() => useFormatting({ locale: "en-US" }));

  expect(result.current.currency.format(1234.56, "EUR")).toBe("€1,234.56");
});

test("should format date correctly", () => {
  const { result } = renderHook(() => useFormatting({ locale: "fr-FR" }));
  const date = new Date("2025-12-06");

  expect(result.current.date.format(date, "long")).toBe("6 décembre 2025");
});
```

### E2E Test: Language Switching

```typescript
import { test, expect } from "@playwright/test";

test("should switch language and update UI", async ({ page }) => {
  await page.goto("http://localhost:5173/profile");

  // Change language
  const localeSelect = page.locator("select").first();
  await localeSelect.selectOption("fr-FR");

  // Verify French text appears
  await expect(page.locator("h1")).toContainText(/Profil|Profile/);
});
```

---

## Troubleshooting

### Issue: Missing Translation Key Warning

**Error:**

```
Warning: key "page.title" not found in namespace "common"
```

**Solution:**

1. Add the key to `locales/en/common.json`
2. Add the translation to `locales/fr/common.json` (and other languages)
3. Verify namespace is loaded in `i18n.ts`

### Issue: Formatter Returns Wrong Value

**Problem:**

```typescript
currency.format(1234.56, "EUR"); // Incorrect symbol position
```

**Solution:**

1. Check your locale setting
2. Verify useFormatting({ locale }) is passed correct locale
3. Test in browser DevTools: `i18n.language`

### Issue: Date Shows Wrong Language

**Problem:**

```
Expected: "6 décembre 2025"
Actual:   "December 6, 2025"
```

**Solution:**

1. Verify language is set to French
2. Check dateFormatter is using correct locale
3. Clear browser cache and refresh

### Issue: Text Not Updating After Language Change

**Problem:**
Component doesn't re-render when language changes

**Solution:**

1. Use `const { t } = useTranslation()` (not module-level)
2. Ensure component is within i18next Provider
3. Don't memoize translation results

### Issue: Performance Degradation with Multiple Formatters

**Problem:**
App becomes slow when using many formatters

**Solution:**

1. Use `useMemo` for expensive formatter calls
2. Move formatter initialization outside render loop
3. Lazy-load non-essential namespaces

---

## Migration Guide: From Old Pattern to New

### Before (Old Pattern)

```typescript
import { formatCurrency } from "../lib/format"

export function MyComponent({ amount, locale }) {
  const formatted = formatCurrency(amount, "EUR", locale)
  return <p>{formatted}</p>
}
```

### After (New Pattern)

```typescript
import { useFormatting } from "../hooks"

export function MyComponent({ amount }) {
  const { currency } = useFormatting()
  return <p>{currency.format(amount, "EUR")}</p>
}
```

### Benefits of New Pattern

✅ **Automatic locale context** (no need to pass locale)  
✅ **Type-safe** (TypeScript catch errors)  
✅ **Reusable** (one import handles all formatters)  
✅ **Performant** (memoized, lazy-loaded)  
✅ **Testable** (easy to mock in tests)

---

## Checklist for New Component

- [ ] Import `useTranslation` from "react-i18next"
- [ ] Import `useFormatting` from "../hooks" (if using numbers/dates)
- [ ] Add translation keys to `locales/en/namespace.json`
- [ ] Add translations to `locales/fr/namespace.json`
- [ ] Add translations to `locales/ar/namespace.json`
- [ ] Add translations to `locales/pt/namespace.json`
- [ ] Add translations to `locales/sw/namespace.json`
- [ ] Use `t()` for all user-facing text
- [ ] Use formatters for all numbers/dates/currencies
- [ ] Test in at least 2 locales
- [ ] Run build to verify no TypeScript errors
- [ ] Document any custom translation patterns

---

## Quick Reference

### Import Statements

```typescript
// Translations
import { useTranslation } from "react-i18next";

// Formatting
import { useFormatting, useLocalization } from "../hooks";
```

### Hook Usage

```typescript
// Get translations
const { t } = useTranslation("namespace");

// Get formatters
const { currency, date, number, percent } = useFormatting();

// Control language
const { locale, changeLanguage, getLocaleName } = useLocalization();
```

### Common Calls

```typescript
t("key.path"); // Get translation
t("key", { name: value }); // With interpolation
currency.format(amount, code); // Format currency
date.format(dateObj, "short" | "long" | "full"); // Format date
number.format(value); // Format number
percent.format(value, "percent" | "decimal"); // Format percent
```

---

## Support & Questions

For additional help:

- Check existing components in `/apps/client/src/pages/`
- Review i18n documentation: `SPRINT_I_PHASE2_GUIDE.md`
- Ask in development team Slack/Discord

---

**Version:** 1.0  
**Last Updated:** 6 décembre 2025  
**Status:** Complete
