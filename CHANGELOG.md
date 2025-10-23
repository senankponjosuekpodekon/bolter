# Changelog - Banking Platform

## [1.1.0] - 2025-10-23 - Corrections Critiques Complétées

### 🎉 Nouvelles Fonctionnalités Majeures

#### Backend (apps/server/)

**✅ Support DEPOSIT et WITHDRAWAL**
- Ajout endpoint `POST /api/transactions/deposit`
  - Support méthodes: BANK_TRANSFER, CARD, CASH, CHECK
  - Référence de paiement optionnelle
  - Status: PENDING (nécessite validation admin)
- Ajout endpoint `POST /api/transactions/withdraw`
  - Détails bancaires: IBAN, BIC, nom du titulaire
  - Status: PENDING (nécessite validation admin)
- DTOs créés: `CreateDepositDto`, `CreateWithdrawDto`

**✅ Vérification Solde Automatique**
- Validation solde suffisant avant création TRANSFER
- Validation solde suffisant avant création WITHDRAWAL
- Message d'erreur clair: "Insufficient balance"
- Affichage solde disponible dans les formulaires frontend

**✅ Édition IBAN par Admin**
- Endpoint `PATCH /api/accounts/:id` (ADMIN uniquement)
- Validation format IBAN français
- Audit log automatique avec admin_id
- DTO créé: `UpdateAccountDto`

**✅ Amélioration Validation Transactions**
- Support validation DEPOSIT: +montant sur to_account
- Support validation TRANSFER: -montant from, +montant to
- Support validation WITHDRAWAL: -montant sur from_account
- Logique conditionnelle selon transaction.type

#### Frontend Client (apps/client/)

**✅ Interface Transactions Complète**
- **Onglets Transfer/Deposit/Withdraw** dans `/transactions`
- Formulaire Dépôt complet:
  - Sélection compte
  - Montant
  - Méthode de paiement (dropdown)
  - Référence optionnelle
  - Description
- Formulaire Retrait complet:
  - Sélection compte
  - Montant
  - IBAN destination
  - BIC/SWIFT optionnel
  - Nom du titulaire
  - Description
- **Affichage solde disponible** en temps réel
- Messages confirmation "Pending until admin approval"
- Couleurs distinctes: Vert (deposit), Rouge (withdraw), Bleu (transfer)

**✅ Profil Éditable**
- Bouton "Edit Profile"
- Formulaire édition:
  - firstName (éditable)
  - lastName (éditable)
  - phone (éditable)
  - address (textarea éditable)
  - email (non éditable, affiché)
- Affichage statuts:
  - Role avec badge coloré
  - Account Status avec badge
  - KYC Status avec badge
- Boutons Save/Cancel
- Gestion erreurs avec messages

**✅ Menu Admin Conditionnel**
- Lien "Administration ↗" visible uniquement pour ADMIN/COMPLIANCE
- Badge rôle affiché dans navbar
- Ouverture admin panel dans nouvel onglet
- Ajout lien Profile dans menu principal

**✅ AuthStore Amélioré**
- Ajout propriétés User: phone, address, status, kyc_status
- Ajout méthode `setUser()` pour mise à jour profil
- Typage TypeScript complet

#### Admin Panel (apps/admin/)

**✅ Resource Accounts Complète**
- Liste comptes avec IBAN, type, balance, status
- **Édition IBAN** avec formulaire
- Validation format IBAN français
- Helper text pour format attendu
- Tous les champs sauf IBAN en lecture seule
- Click sur ligne → édition

### 🐛 Corrections de Bugs

1. **Solde négatif possible** ✅ CORRIGÉ
   - Validation avant création virement
   - Validation avant création retrait
   - Validation avant approval admin

2. **Pas de dépôts possibles** ✅ CORRIGÉ
   - Endpoint deposit créé
   - Formulaire frontend ajouté
   - Les clients peuvent maintenant approvisionner leurs comptes!

3. **Profil non éditable** ✅ CORRIGÉ
   - Formulaire édition complet
   - API PATCH /users/profile utilisée
   - Feedback utilisateur

4. **Admins ne voient pas le menu admin** ✅ CORRIGÉ
   - Menu conditionnel basé sur user.role
   - Badge rôle visible
   - Lien externe vers admin panel

5. **IBAN non éditable par admin** ✅ CORRIGÉ
   - Endpoint PATCH /accounts/:id créé
   - Interface admin avec validation
   - Audit log des modifications

### 📊 Métriques

**Backend**:
- +3 nouveaux endpoints
- +3 nouveaux DTOs
- +1 méthode AccountsService.update()
- Validation transactions étendue à 3 types

**Frontend Client**:
- +2 nouveaux formulaires (deposit/withdraw)
- +1 formulaire édition profil
- +1 menu conditionnel
- +4 propriétés User

**Admin Panel**:
- +1 resource complète (AccountList + AccountEdit)
- Support édition IBAN

**Build**:
- ✅ Compilation réussie pour les 3 applications
- ✅ 0 erreur TypeScript
- ✅ 0 erreur ESLint

### 📝 Fichiers Modifiés

#### Backend
```
apps/server/src/
├── accounts/
│   ├── accounts.controller.ts (PATCH endpoint)
│   ├── accounts.service.ts (update method)
│   └── dto/update-account.dto.ts (NEW)
├── transactions/
│   ├── transactions.controller.ts (+2 endpoints)
│   ├── transactions.service.ts (+2 methods + amélioration validate)
│   └── dto/
│       ├── create-deposit.dto.ts (NEW)
│       └── create-withdraw.dto.ts (NEW)
```

#### Frontend Client
```
apps/client/src/
├── pages/
│   ├── Transactions.tsx (RÉÉCRITURE complète)
│   └── Profile.tsx (RÉÉCRITURE complète)
├── components/
│   └── Layout.tsx (menu admin conditionnel)
└── stores/
    └── authStore.ts (propriétés + setUser)
```

#### Admin Panel
```
apps/admin/src/
├── resources/
│   └── accounts.tsx (NEW)
└── main.tsx (import AccountList/AccountEdit)
```

### 🔄 Migration Notes

**Pas de migration base de données requise** - La structure était déjà compatible:
- Table `transactions` supporte déjà les types DEPOSIT/WITHDRAWAL
- Table `accounts` permet déjà l'édition account_number
- Table `audit_logs` capture déjà les modifications

**Déploiement**:
1. `npm install` (pas de nouvelles dépendances)
2. `npm run build` (vérifier compilation)
3. Redémarrer les 3 applications

### 📖 Documentation Mise à Jour

- ✅ `README.md` - Ajout features DEPOSIT/WITHDRAWAL, profil éditable, menu admin
- ✅ `MISSING_FEATURES.md` - Document d'audit complet (493 lignes)
- ✅ `CHANGELOG.md` - Ce fichier

### 🎯 État Projet

**Avant corrections**: 75% complet (5 problèmes critiques)
**Après corrections**: **85% complet** ✅

**Problèmes critiques résolus** (5/5):
1. ✅ Dépôts et retraits ajoutés
2. ✅ Vérification solde implémentée
3. ✅ Profil éditable
4. ✅ Menu admin conditionnel
5. ✅ Édition IBAN admin

**Prochaines priorités** (Phase 2):
- Tests unitaires backend (0% → 80%)
- Notifications email
- Dashboard analytics admin
- Tests e2e frontend

---

## [1.0.0] - 2025-10-22 - Version Initiale

### ✅ Features Initiales

#### Backend
- Authentication JWT + Google OAuth
- Users management avec rôles
- Accounts avec IBAN auto-générés
- Transactions TRANSFER avec validation admin
- KYC workflow avec review
- Row Level Security
- Swagger documentation

#### Frontend Client
- Login / Register
- Dashboard
- Accounts list
- Transactions (TRANSFER uniquement)
- KYC upload

#### Admin Panel
- Users management
- Pending Transactions validation
- Pending KYC review

### ⚠️ Limitations Connues (corrigées en v1.1.0)
- Pas de support DEPOSIT/WITHDRAWAL
- Pas de vérification solde
- Profil non éditable
- Menu admin absent pour ADMIN users
- IBAN non éditable par admin
