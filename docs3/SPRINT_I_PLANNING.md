# Sprint I: Multi-Devise & Multi-Langue 🌍

**Durée estimée:** 9 heures (au lieu de 10, grâce aux pages existantes)  
**Complexité:** Moyenne  
**Dépendances:** Sprint H (CI/CD) ✅  
**État Actuel:** Register + Profile pages ont déjà sélecteurs de locale/currency/timezone!

---

## 📋 Objectifs Principaux

### 1. **Multi-Devise (EUR, USD, GBP, CAD, AED, NGN, GHS, ZAR, XOF)**

- ✅ Backend: Service de conversion de devises en temps réel
- ✅ Frontend: Affichage des montants dans la devise de l'utilisateur
- ✅ Historique: Conversion des transactions dans la devise originale
- ✅ Admin: Gestion des taux de change

### 2. **Multi-Langue (EN + FR minimum)**

- ✅ Frontend: UI complètement traduite (EN/FR)
- ✅ Backend: Messages d'erreur et notifications en multi-langue
- ✅ Admin: Gestion des traductions
- ✅ Formatage régional: Dates, nombres, symboles monétaires

### 3. **Intégration Utilisateur**

- ✅ Préférences utilisateur: Devise + Langue (déjà en DB)
- ✅ Persistance: Sauvegarde des préférences
- ✅ Défaut: Détection automatique (navigateur + IP)

---

## 🏗️ Architecture Proposée

### **Backend (NestJS)**

```
src/
├── exchange/
│   ├── exchange.service.ts          [EXISTANT - À améliorer]
│   ├── exchange.controller.ts       [EXISTANT]
│   ├── exchange.module.ts           [EXISTANT]
│   ├── dto/
│   │   ├── conversion-request.dto.ts [NOUVEAU]
│   │   └── conversion-response.dto.ts [NOUVEAU]
│   └── interfaces/
│       └── exchange-rate.interface.ts [NOUVEAU]
│
├── localization/                    [NOUVEAU MODULE]
│   ├── localization.service.ts
│   ├── localization.controller.ts
│   ├── localization.module.ts
│   ├── messages/
│   │   ├── en.messages.json
│   │   └── fr.messages.json
│   └── formatters/
│       ├── currency.formatter.ts
│       ├── date.formatter.ts
│       └── number.formatter.ts
│
├── users/                           [MODIFIER]
│   └── users.service.ts            [Ajouter méthodes multi-devise]
│
└── transactions/                    [MODIFIER]
    └── transactions.service.ts      [Conversion automatique]
```

### **Frontend (React)**

```
src/
├── i18n.ts                          [AMÉLIORER]
├── locales/
│   ├── en/
│   │   ├── common.json              [COMPLÉTER]
│   │   ├── transactions.json        [NOUVEAU]
│   │   ├── kyc.json                 [NOUVEAU]
│   │   ├── admin.json               [NOUVEAU]
│   │   └── errors.json              [NOUVEAU]
│   └── fr/
│       ├── common.json              [COMPLÉTER]
│       ├── transactions.json        [NOUVEAU]
│       ├── kyc.json                 [NOUVEAU]
│       ├── admin.json               [NOUVEAU]
│       └── errors.json              [NOUVEAU]
│
├── hooks/
│   ├── useCurrency.ts               [NOUVEAU]
│   ├── useLocalization.ts           [NOUVEAU]
│   ├── useExchange.ts               [NOUVEAU]
│   └── useFormatting.ts             [NOUVEAU]
│
├── services/
│   ├── currencyService.ts           [NOUVEAU]
│   ├── localizationService.ts       [NOUVEAU]
│   └── exchangeService.ts           [NOUVEAU - Appelle backend]
│
├── utils/
│   ├── formatters/
│   │   ├── currencyFormatter.ts     [NOUVEAU]
│   │   ├── dateFormatter.ts         [NOUVEAU]
│   │   ├── numberFormatter.ts       [NOUVEAU]
│   │   └── percentFormatter.ts      [NOUVEAU]
│   └── converters/
│       └── currencyConverter.ts     [NOUVEAU]
│
├── components/
│   └── localization/
│       ├── LanguageSwitcher.tsx     [NOUVEAU]
│       ├── CurrencySwitcher.tsx     [NOUVEAU]
│       ├── CurrencyDisplay.tsx      [NOUVEAU]
│       └── LocalizedDate.tsx        [NOUVEAU]
│
└── pages/
    ├── Profile.tsx                  [MODIFIER - Ajouter sélecteurs]
    ├── Transactions.tsx             [MODIFIER - Afficher devise]
    ├── Dashboard.tsx                [MODIFIER - Formatage]
    └── admin/
        └── Exchange.tsx             [NOUVEAU - Gestion taux]
```

---

## 📊 Workflows Détaillés

### **Workflow 1: Conversion de Devise**

```
Utilisateur effectue une transaction en EUR
    ↓
Backend: Enregistre montant original + devise (EUR)
    ↓
Frontend: Récupère devise préférence utilisateur (USD)
    ↓
ExchangeService: Appelle API backend → /api/exchange/convert
    ↓
Backend: Calcule conversion EUR → USD avec taux en cache
    ↓
Frontend: Affiche montant converti avec taux appliqué
    ↓
Historique: Conserve montant original pour audit
```

### **Workflow 2: Changement de Langue**

```
Utilisateur clique sur sélecteur de langue (EN → FR)
    ↓
i18n: Détecte la nouvelle locale (fr-FR)
    ↓
Frontend: Charge dynamiquement bundle de traduction (fr/common.json)
    ↓
React: Re-render tous les composants avec useTranslation()
    ↓
Backend: Sauvegarde préférence utilisateur (users.locale = 'fr-FR')
    ↓
localStorage: Persiste choix utilisateur
```

### **Workflow 3: Affichage Multi-Devise dans Transactions**

```
Transactions.tsx charge les données
    ↓
Pour chaque transaction:
  - Récupère devise original (EUR) + montant (100)
  - Récupère devise utilisateur (USD) de user.currency
  - Appelle currencyFormatter.format(100, 'EUR', 'USD')
    ↓
Formatter:
  1. Récupère taux de change (1.08)
  2. Calcule 100 × 1.08 = 108
  3. Formatte avec symbole: "$108.00" ou "108,00 $"
    ↓
Affiche: "100€ → 108$" ou mention du taux
```

### **Workflow 4: Formatage Régional**

```
Utilisateur avec locale = fr-FR
    ↓
dateFormatter.format(new Date(), 'fr-FR')
    ↓
Output: "05 décembre 2025" (format français)
    vs.
User locale = en-US → "December 05, 2025"
    ↓
numberFormatter.format(1234.56, 'fr-FR')
    → "1.234,56"
    vs.
numberFormatter.format(1234.56, 'en-US')
    → "1,234.56"
```

---

## 📝 Checklist Implémentation

### **Phase 1: Backend (2h)**

- [ ] **ExchangeService Enhancement**
  - [ ] Ajouter méthode `getMultipleRates(baseCurrency: string): Record<string, number>`
  - [ ] Ajouter cache avec TTL (1h)
  - [ ] Ajouter validation des devises supportées
  - [ ] Créer DTOs pour requêtes/réponses

- [ ] **LocalizationService (NEW)**
  - [ ] Service pour gérer messages multilingues
  - [ ] Méthode `getMessage(key: string, locale: string, params?: {}): string`
  - [ ] Fallback automatique à EN si locale non trouvée
  - [ ] Support des variables dans messages ({0}, {name}, etc.)

- [ ] **Currency/Date/Number Formatters**
  - [ ] `CurrencyFormatter`: Format devise basé sur locale
  - [ ] `DateFormatter`: Format date (d/m/y ou m/d/y selon locale)
  - [ ] `NumberFormatter`: Séparateurs décimaux et milliers
  - [ ] Tests unitaires pour chaque formatter

- [ ] **Exchange Controller Endpoints**

  ```
  GET  /api/exchange/rates?base=EUR
  POST /api/exchange/convert { amount, from, to }
  GET  /api/exchange/supported-currencies
  POST /api/admin/exchange/update-rates [ADMIN ONLY]
  ```

- [ ] **Users Service Updates**
  - [ ] Ajouter validation des devises lors de `updateProfile()`
  - [ ] Ajouter validation des locales
  - [ ] Ajouter valeurs par défaut intelligentes

### **Phase 2: Frontend - Infrastructure (2.5h)**

- [ ] **i18n Configuration**
  - [ ] Améliorer détection de langue (browser → localStorage → default)
  - [ ] Configurer namespaces: common, transactions, kyc, admin, errors
  - [ ] Setup lazy loading des langues (actuellement fait)
  - [ ] Ajouter support interpolation avancée

- [ ] **Fichiers de Traduction (EN)**
  - [ ] `locales/en/common.json` (compléter)
  - [ ] `locales/en/transactions.json` (types, statuts, labels)
  - [ ] `locales/en/kyc.json` (statuts KYC, champs)
  - [ ] `locales/en/admin.json` (dashboards, bulk ops)
  - [ ] `locales/en/errors.json` (tous les messages d'erreur)

- [ ] **Fichiers de Traduction (FR)**
  - [ ] `locales/fr/common.json` (version française)
  - [ ] `locales/fr/transactions.json`
  - [ ] `locales/fr/kyc.json`
  - [ ] `locales/fr/admin.json`
  - [ ] `locales/fr/errors.json`

- [ ] **Formatters Utilitaires**
  - [ ] `currencyFormatter.ts`: Format montants avec devise
  - [ ] `dateFormatter.ts`: Format dates selon locale
  - [ ] `numberFormatter.ts`: Format nombres selon locale
  - [ ] `percentFormatter.ts`: Format pourcentages

- [ ] **Custom Hooks**
  - [ ] `useCurrency()`: Accès devise utilisateur + conversion
  - [ ] `useLocalization()`: Accès locale + traduction
  - [ ] `useExchange()`: Appels API exchange
  - [ ] `useFormatting()`: Formatages multiples

- [ ] **Services**
  - [ ] `currencyService.ts`: Cache devises, taux
  - [ ] `exchangeService.ts`: Appels API backend
  - [ ] `localizationService.ts`: Détection intelligente

### **Phase 3: Frontend - Composants (3h)**

- [ ] **Composants Localization**
  - [ ] `CurrencyDisplay.tsx`: Affiche montant + devise avec conversion
  - [ ] `LocalizedDate.tsx`: Affiche date formatée selon locale
  - [ ] `CurrencySwitcher.tsx`: Mini switcher pour navbar (optionnel)
  - [ ] `LanguageSwitcher.tsx`: Mini switcher pour navbar (optionnel)

- [ ] **Register Page (DÉJÀ EXISTANT - À améliorer)**
  - [ ] ✅ Sélecteur de locale avec 7 langues
  - [ ] ✅ Sélecteur de devise avec 9 devises
  - [ ] ✅ Sélecteur de timezone avec 9 zones
  - [ ] À faire: Ajouter symboles/flags dans les options
  - [ ] À faire: Mettre à jour traductions (register labels)

- [ ] **Profile Page (PARTIELLEMENT EXISTANT)**
  - [ ] ✅ Mutation pour sauvegarder locale + currency
  - [ ] ✅ États locaux pour locale et currencyPref
  - [ ] À faire: Améliorer UX des sélecteurs (ajouter flags)
  - [ ] À faire: Mettre à jour les labels de traduction
  - [ ] À faire: Ajouter preview du formatage (avant/après)
  - [ ] À faire: Valider devises supportées au backend

- [ ] **Transactions Page Updates**
  - [ ] Afficher montant original + devise originale
  - [ ] Afficher montant converti dans devise utilisateur
  - [ ] Afficher taux appliqué (optionnel info tooltip)
  - [ ] Trier/filtrer par devise (optionnel)
  - [ ] Utiliser `CurrencyDisplay.tsx` pour tous les montants

- [ ] **KYC Page Updates**
  - [ ] Tous les labels en multi-langue
  - [ ] Dates formatées avec `LocalizedDate.tsx`
  - [ ] Nombres formatés correctement
  - [ ] Utiliser composants formatage

- [ ] **Admin Dashboard Updates**
  - [ ] Exchange rates management panel
  - [ ] Voir taux actuels pour chaque paire
  - [ ] Bouton pour mettre à jour manuellement (Mock pour Sprint I)
  - [ ] Afficher devise préférence user

### **Phase 4: Tests & Intégration (2h)**

- [ ] **Tests Unitaires (Backend)**
  - [ ] ExchangeService: Conversion rates, caching
  - [ ] CurrencyFormatter: Format correct par devise
  - [ ] DateFormatter: Format correct par locale
  - [ ] NumberFormatter: Séparateurs corrects

- [ ] **Tests Unitaires (Frontend)**
  - [ ] Hooks: useCurrency, useLocalization
  - [ ] Formatters: Currency, Date, Number
  - [ ] Services: Appels API corrects

- [ ] **Tests E2E (Playwright)**
  - [ ] Changer langue: Vérifier re-render UI
  - [ ] Changer devise: Vérifier affichage montants
  - [ ] Conversion: Montants corrects
  - [ ] Persistance: Actualiser page, prefs conservées

- [ ] **Documentation**
  - [ ] Créer `SPRINT_I_COMPLETION.md`
  - [ ] Documenter format des fichiers de traduction
  - [ ] Documenter comment ajouter nouvelle devise
  - [ ] Documenter comment ajouter nouvelle langue

---

## 🔧 Technologies & Dépendances

### **Déjà Présents**

- ✅ `i18next` + `react-i18next` (frontend)
- ✅ `i18next-browser-languagedetector`
- ✅ `ExchangeService` (backend)

### **À Ajouter**

- [ ] `intl` (navigateur API pour formatage régional)
- [ ] `date-fns` (formatage dates avancé)
- [ ] `decimal.js` (précision pour devises)

### **Recommandé (Optionnel)**

- [ ] `dinero.js` (mieux gérer argent que simples nombres)
- [ ] `fixer.io` API (taux réels au lieu de cache en dur)

---

## 📊 Estimation Détaillée

| Phase             | Tâche                                       | Durée        | Notes                                    |
| ----------------- | ------------------------------------------- | ------------ | ---------------------------------------- |
| 1                 | ExchangeService enhancement                 | 30min        | Améliorer caching, validation            |
| 1                 | LocalizationService                         | 30min        | Gestion messages multilingues            |
| 1                 | Formatters (Currency, Date, Number)         | 45min        | 3 formatters + tests                     |
| 1                 | Exchange Controller endpoints               | 15min        | 4 endpoints                              |
| 1                 | Tests + intégration backend                 | 30min        |                                          |
| **Phase 1 Total** |                                             | **2h 30min** |                                          |
| 2                 | i18n configuration + detection              | 45min        | Améliorer logique                        |
| 2                 | Traductions EN (5 fichiers)                 | 60min        | common, transactions, kyc, admin, errors |
| 2                 | Traductions FR (5 fichiers)                 | 75min        | Traduction complète                      |
| 2                 | Frontend formatters (utils)                 | 45min        | 4 formatters                             |
| 2                 | Custom hooks                                | 30min        | 4 hooks custom                           |
| **Phase 2 Total** |                                             | **2h 45min** |                                          |
| 3                 | Composants: CurrencyDisplay + LocalizedDate | 45min        | 2 composants core                        |
| 3                 | Register page updates                       | 20min        | Ajouter symboles/flags                   |
| 3                 | Profile page improvements                   | 30min        | UX, flags, validation                    |
| 3                 | Transactions page integration               | 30min        | CurrencyDisplay, conversion              |
| 3                 | KYC + Admin pages updates                   | 40min        | Labels, formatage                        |
| **Phase 3 Total** |                                             | **2h 45min** |                                          |
| 4                 | Tests unitaires                             | 60min        | Backend + frontend formatters            |
| 4                 | Tests E2E                                   | 45min        | Playwright scenarios                     |
| 4                 | Documentation                               | 15min        | SPRINT_I_COMPLETION.md                   |
| **Phase 4 Total** |                                             | **2h**       |                                          |
|                   |                                             | **TOTAL**    | **9h**                                   |

---

## ✨ Résultats Attendus

### **Avant (Actuellement)**

- ❌ Devise fixée en EUR
- ⚠️ Langue: Sélecteurs en Register + Profile, mais UI incomplètement traduite
- ❌ Formatage: US uniquement (1,234.56)
- ❌ Pas de support multi-devise dans transactions
- ⚠️ Register + Profile: Sélecteurs existants, mais UX basique (sans flags/symboles)

### **Après Sprint I**

- ✅ Devise: EUR, USD, GBP, CAD, AED, NGN, GHS, ZAR, XOF (9 devises)
- ✅ Langue: EN + FR 100% traduit (traductions cohérentes partout)
- ✅ Formatage: Régional intelligent (fr: 1.234,56 / en: 1,234.56 / dates localisées)
- ✅ Transactions affichent devise + conversion automatique
- ✅ Taux actualisables par admin (backend API + mock panel)
- ✅ Register + Profile: UX améliorée (flags, symboles, preview)
- ✅ API Exchange complète et documentée
- ✅ Tous les composants utilisent traductions + formatage localisé

---

## 🚀 Commencer

**Ordre recommandé:**

1. ✅ Phase 1: Backend - construire fondations
2. ✅ Phase 2: Frontend infra - configuration i18n
3. ✅ Phase 3: Composants - UI multi-langue/devise
4. ✅ Phase 4: Tests - valider tout

**Commandes de démarrage:**

```bash
# Démarrer développement
npm run dev

# Tests en cours de développement
npm run test:watch

# Vérifier couverture
npm run test:coverage

# Linter avant commit
npm run lint:fix
```

---

## 🎯 Critères de Succès

- ✅ Changer langue → entire UI se traduit instantanément
- ✅ Changer devise → tous montants se convertissent
- ✅ Actualiser page → préférences sont conservées
- ✅ Tous les fichiers JSON de traduction à jour
- ✅ Formatage dates/nombres correct pour chaque locale
- ✅ Tests couvrent 70% minimum
- ✅ E2E tests passent (Playwright)
- ✅ Pas d'erreurs compilation/linting
