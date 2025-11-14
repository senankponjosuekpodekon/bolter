# Banking Platform - Full Stack Monorepo

Plateforme bancaire complète avec Backend NestJS, Frontend Client React, et Admin Panel React-Admin.

## 🏗️ Architecture Monorepo

```
banking-platform/
├── apps/
│   ├── server/          # Backend NestJS + Supabase
│   ├── client/          # Frontend Client React + Vite
│   └── admin/           # Admin Panel React-Admin
├── package.json         # Root workspace configuration
└── README.md
```

## ✅ Applications

### 1. Backend Server (apps/server/) - Port 3000

**NestJS + TypeScript + Supabase**

**Modules**:

- **Auth Module**: JWT + Google OAuth, login/register
- **Users Module**: Gestion utilisateurs avec rôles (CLIENT, ADMIN, COMPLIANCE)
- **Accounts Module**: Comptes bancaires avec IBAN français auto-générés + **édition IBAN/Type/Status/Balance par admin (auditée)** ⭐⭐
- **Transactions Module**:
  - **Virements** (TRANSFER) avec validation admin obligatoire ⭐
  - **Dépôts** (DEPOSIT) avec validation admin obligatoire ⭐⭐
  - **Retraits** (WITHDRAWAL) avec validation admin obligatoire ⭐⭐
  - **Vérification solde automatique** avant transactions ✅
  - **Création transaction administrateur** (auto-approve option + audit) ⭐⭐
- **KYC Module**: Upload documents avec **workflow de review** ⭐

**Features clés**:

- ✅ Swagger documentation: http://localhost:3000/api/docs
- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Audit trail complet (validated_by, reviewed_by, changes)
- ✅ Service d'audit centralisé (auth, users, accounts, transactions)
- ✅ États transactions: PENDING → APPROVED/REJECTED
- ✅ États KYC: PENDING → APPROVED/REJECTED
- ✅ Vérification solde suffisant avant virements/retraits
- ✅ Support DEPOSIT/WITHDRAWAL en plus des TRANSFER

### 2. Client Dashboard (apps/client/) - Port 5173

**React 18 + TypeScript + Vite + Tailwind CSS**

**Pages**:

- `/login` - Connexion utilisateur
- `/register` - Inscription nouveau compte
- `/dashboard` - Vue d'ensemble (soldes, transactions récentes)
- `/transactions` - **Onglets Transfer/Deposit/Withdraw** ⭐⭐⭐
  - Formulaire virement (TRANSFER)
  - Historique complet avec statuts
- `/profile` - **Gestion profil éditable** ⭐⭐
  - Modification firstName, lastName, phone, address
  - Vue des statuts (role, account status, KYC status)


- ✅ **Menu Administration conditionnel** - Visible uniquement pour ADMIN/COMPLIANCE ⭐

- **Users** - CRUD utilisateurs, gestion rôles et statuts
  - Liste tous les comptes bancaires avec owner et soldes
  - Audit log automatique des modifications
- **Audit Logs** - **Historique complet des actions** ⭐⭐
- ✅ Gestion utilisateurs avec modification rôles
- ✅ **Consultation Audit Logs** depuis l'admin pour tracer toutes les actions
- ✅ Auth réservée aux rôles ADMIN et COMPLIANCE

  - Endpoints sécurisés (ROLE = ADMIN/COMPLIANCE) pour listing, édition profil, changement rôle/statut, activation/désactivation.
  - Services appliquent validations (immutabilité email, rôles autorisés) et publient les entrées `audit_logs` (`resource_type = "user"`, `action` = role_change|status_update|profile_update).
  - DTO retournent métadonnées (`validated_by`, `updated_at`) afin d’alimenter l’UI React-Admin.

- **Frontend (React-Admin)**
  - Resource `users`: `Datagrid` + `Edit` form pilotant les mutations (role/status toggle, reset 2FA).
  - `useMutation` déclenche un `PATCH`/`POST` vers chaque endpoint dédié, puis rafraîchit la liste (`refresh` + `invalidateStore`).
  - Affichage des retours backend (snackbar succès/erreur) et des informations d’audit (`lastActionBy`, `lastActionAt`).

  - Services Nest injectent `AuditLogsService` pour consigner authentification, comptes, utilisateurs et transactions.
  - L'admin panel consomme `GET /audit-logs` (filtres action/resource/user) pour afficher l'historique des opérations.

## 🚀 Quick Start

```bash
```

- Admin panel: http://localhost:5174
**Démarrage individuel**:

npm run dev:admin     # Admin only

## 🔐 Workflows Principaux
   → Transaction status: PENDING

2. ADMIN consulte transactions pending (Admin app)
   → Approve: Status APPROVED + Soldes mis à jour
```


   → Preview document (image/PDF)
   → Liste tous les documents PENDING

3. COMPLIANCE valide chaque document (Admin app)
   → Approve: Document APPROVED
   → Reject: Document REJECTED + Raison
   → User KYC status mis à jour automatiquement
```

## 📦 Scripts Disponibles

### Root (monorepo)

```bash
npm run dev              # Start all apps
npm run build            # Build all apps
npm run dev:server       # Start server only
npm run dev:client       # Start client only
npm run dev:admin        # Start admin only
npm run build:server     # Build server
npm run build:client     # Build client
npm run build:admin      # Build admin
```

## 🔧 Configuration

### Supabase Setup

Créer `apps/server/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=notifications@banking-platform.test
APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
VITE_NOTIFICATIONS_URL=http://localhost:3000
PORT=3000
```

### Base de données Supabase

### Tables principales

```sql
users: id, email, password_hash, first_name, last_name, phone, role, status, kyc_status, two_factor_enabled, refresh_token

accounts: id, user_id, account_number (IBAN), account_type, currency, balance, status

transactions: id, from_account_id, to_account_id, amount, currency, type, status, description, iban_external, validated_by, validated_at, rejection_reason

kyc_documents: id, user_id, document_type, file_path, file_size, mime_type, status, reviewed_by, reviewed_at, rejection_reason

audit_logs: id, user_id, action, resource_type, resource_id, ip_address, user_agent, metadata
```

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec politiques strictes:

- Users peuvent voir/modifier leur propre profil
- Accounts accessibles uniquement par le propriétaire
- Transactions visibles uniquement par les parties concernées
- Admin/Compliance ont accès complet en lecture et validation

## Installation

### Prérequis

- Node.js 18+
- npm
- Compte Supabase

### Configuration

1. Créer un fichier `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=2592000

EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=notifications@banking-platform.test

APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
VITE_NOTIFICATIONS_URL=http://localhost:3000

PORT=3000
NODE_ENV=development
```

2. Installer les dépendances:

```bash
npm install
```

3. La migration Supabase a été appliquée automatiquement

## Démarrage

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Documentation Swagger disponible sur: `http://localhost:3000/api/docs`

### Endpoints principaux

**Auth**

- POST /api/auth/register - Inscription
- POST /api/auth/login - Connexion
- POST /api/auth/refresh - Refresh token

**Users**

- GET /api/users - Liste (ADMIN)
- GET /api/users/profile - Mon profil
- PATCH /api/users/profile - Mettre à jour profil
- POST /api/users - Création par admin (audit automatique)
- PATCH /api/users/:id - Mise à jour par admin (audit automatique)
- DELETE /api/users/:id - Suppression par admin (audit automatique)

**Accounts**

- GET /api/accounts - Mes comptes
- GET /api/accounts?scope=admin - Liste complète (ADMIN)
- GET /api/accounts/:id/balance - Consulter solde
- PATCH /api/accounts/:id - Edition IBAN/Type/Status/Balance (ADMIN)

**Transactions**

- POST /api/transactions/transfer - Créer virement
- POST /api/transactions/deposit - Créer dépôt
- POST /api/transactions/withdraw - Créer retrait
- POST /api/transactions/admin - Créer transaction administrateur (auto approve option)
- GET /api/transactions - Mes transactions
- GET /api/transactions/pending - En attente (ADMIN)
- GET /api/transactions?scope=admin - Historique complet (ADMIN)
- PATCH /api/transactions/:id/validate - Valider (ADMIN)

**KYC**

- POST /api/kyc/documents - Upload document
- GET /api/kyc/documents - Mes documents
- GET /api/kyc/documents/pending - En attente (ADMIN)
- PATCH /api/kyc/documents/:id/review - Valider (ADMIN)

**Audit Logs**

- GET /api/audit-logs - Liste filtrable (action, resource_type, user, performedBy)

## Workflow utilisateur

### 1. Inscription

```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

→ Crée user + compte bancaire automatiquement

### 2. Upload documents KYC

```bash
POST /api/kyc/documents
{
  "documentType": "ID_CARD",
  "filePath": "/storage/docs/id.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

### 3. Créer dépôt (NEW!)

```bash
POST /api/transactions/deposit
{
  "accountId": "uuid-account",
  "amount": 1000.00,
  "paymentMethod": "BANK_TRANSFER",
  "reference": "REF123",
  "description": "Initial deposit"
}
```

→ Transaction DEPOSIT PENDING, attend validation admin

### 4. Créer virement

```bash
POST /api/transactions/transfer
{
  "fromAccountId": "uuid-account",
  "toAccountId": "uuid-recipient",
  "amount": 150.50,
  "description": "Payment"
}
```

→ Transaction TRANSFER PENDING, attend validation admin
→ ✅ Vérification automatique: solde suffisant avant création

### 5. Créer retrait (NEW!)

```bash
POST /api/transactions/withdraw
{
  "accountId": "uuid-account",
  "amount": 500.00,
  "bankDetails": {
    "iban": "FR7612345678901234567890123",
    "bic": "BNPAFRPP",
    "accountHolderName": "John Doe"
  },
  "description": "Withdrawal to external account"
}
```

→ Transaction WITHDRAWAL PENDING, attend validation admin
→ ✅ Vérification automatique: solde suffisant avant création

### 6. Validation admin

```bash
PATCH /api/transactions/:id/validate
{
  "approved": true
}
```

→ Soldes mis à jour automatiquement selon le type:

- DEPOSIT: +montant sur to_account
- TRANSFER: -montant sur from_account, +montant sur to_account
- WITHDRAWAL: -montant sur from_account

## Sécurité

- Passwords hashés avec bcrypt
- JWT tokens avec expiration
- Row Level Security (RLS) sur toutes les tables
- Validation des données avec class-validator
- Guards NestJS (JwtAuthGuard + RolesGuard)

## 📊 État du Projet

### ✅ Complété (100%)

**Architecture**:

- ✅ Monorepo avec workspaces npm
- ✅ Backend NestJS + Supabase
- ✅ Frontend Client React + Vite + Tailwind
- ✅ Admin Panel React-Admin

**Features Backend**:

- ✅ Authentication JWT + Google OAuth
- ✅ Users management avec rôles
- ✅ Accounts avec IBAN français + **édition IBAN/Type/Status/Balance (audit)** ⭐⭐
- ✅ Transactions complètes:
  - ✅ **DEPOSIT** (dépôts) avec validation admin ⭐⭐
  - ✅ **TRANSFER** (virements) avec validation admin ⭐
  - ✅ **WITHDRAWAL** (retraits) avec validation admin ⭐⭐
  - ✅ **Vérification solde** automatique ✅
- ✅ KYC workflow complet avec review ⭐
- ✅ Row Level Security (RLS)
- ✅ Audit trail complet avec logs modifications
- ✅ Service d'audit global (auth, users, accounts, transactions)

**Features Frontend Client**:

- ✅ Login / Register
- ✅ Dashboard avec statistiques
- ✅ Consultation comptes et soldes
- ✅ **Transactions avec onglets** Transfer/Deposit/Withdraw ⭐⭐⭐
- ✅ **Affichage solde disponible** en temps réel
- ✅ Upload documents KYC
- ✅ **Profil éditable** (firstName, lastName, phone, address) ⭐⭐
- ✅ **Menu admin conditionnel** pour ADMIN/COMPLIANCE ⭐
- ✅ Historique transactions complet

**Features Admin Panel**:

- ✅ Authentication (Admin/Compliance only)
- ✅ Validation transactions (Approve/Reject) - TOUS TYPES ⭐⭐⭐
- ✅ Review documents KYC (Approve/Reject) ⭐
- ✅ Gestion utilisateurs (CRUD + rôles)
- ✅ **Edition comptes bancaires (IBAN/Type/Status/Balance) avec audit** ⭐⭐
- ✅ **Vue Audit Logs** filtrable (actions, entités, user)

### 🚧 Améliorations Futures

**Backend**:

- [ ] Tests unitaires et e2e
- [ ] Notifications email (transactions validées, KYC reviewed)
- [ ] WebSocket pour notifications temps réel
- [ ] 2FA authentification (TOTP)
- [ ] Support multi-devises (EUR, USD, GBP)
- [ ] Export PDF relevés de compte
- [ ] Scheduled transactions (virements programmés)

**Frontend**:

- [ ] Tests composants React
- [ ] Tests e2e (Playwright/Cypress)
- [ ] Notifications toast améliorées
- [ ] Dark mode
- [ ] Graphiques analytics avancés

**Admin**:

- [ ] Dashboard analytics avec graphiques
- [ ] Export CSV/PDF des données
- [ ] Filtres avancés supplémentaires (multi critères)
- [ ] Actions bulk (validation multiple, mises à jour groupées)

**DevOps**:

- [ ] Docker + Docker Compose
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring (Datadog, Sentry)
- [ ] Health checks et alerts

## 📖 Documentation

- `README.md` - Ce fichier (vue d'ensemble)
- `IMPLEMENTATION.md` - Détails techniques implémentation
- `MISSING_FEATURES.md` - Analyse complète de ce qui manque
- `README_MONOREPO.md` - Guide rapide monorepo

## 🤝 Contribution

Ce projet est une plateforme bancaire complète avec:

- Validation manuelle des transactions par des admins
- Workflow KYC avec review par compliance
- Audit trail complet pour la conformité réglementaire

## 📄 Licence

MIT
