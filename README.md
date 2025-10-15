# Banking Platform - NestJS + Supabase

Plateforme bancaire complète avec gestion KYC, transactions et validation administrative.

## Architecture

### Backend (NestJS)
- **Framework**: NestJS avec TypeScript
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: JWT + Google OAuth
- **API**: RESTful avec documentation Swagger

### Modules

#### 1. **Auth Module**
- Inscription/Connexion (email/password)
- OAuth Google
- JWT tokens (access + refresh)
- Sécurité avec bcrypt

#### 2. **Users Module**
- Gestion des utilisateurs
- Profils utilisateurs
- Rôles: CLIENT, ADMIN, COMPLIANCE
- Statuts: ACTIVE, SUSPENDED, PENDING_VERIFICATION, CLOSED

#### 3. **Accounts Module**
- Comptes bancaires (CHECKING, SAVINGS)
- Génération automatique d'IBAN français
- Consultation des soldes
- Un compte par défaut créé à l'inscription

#### 4. **Transactions Module**
- Création de virements
- Historique des transactions
- **Validation admin** : transactions en attente nécessitent approbation
- Support virements SEPA (IBAN externes)
- États: PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED

#### 5. **KYC Module**
- Upload de documents (ID_CARD, PASSPORT, SELFIE, PROOF_ADDRESS)
- Workflow de validation par équipe compliance
- Mise à jour automatique du statut KYC utilisateur
- États: PENDING, SUBMITTED, APPROVED, REJECTED

## Base de données Supabase

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
JWT_EXPIRES_IN=3600
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=2592000

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

**Accounts**
- GET /api/accounts - Mes comptes
- GET /api/accounts/:id/balance - Consulter solde

**Transactions**
- POST /api/transactions/transfer - Créer virement
- GET /api/transactions - Mes transactions
- GET /api/transactions/pending - En attente (ADMIN)
- PATCH /api/transactions/:id/validate - Valider (ADMIN)

**KYC**
- POST /api/kyc/documents - Upload document
- GET /api/kyc/documents - Mes documents
- GET /api/kyc/documents/pending - En attente (ADMIN)
- PATCH /api/kyc/documents/:id/review - Valider (ADMIN)

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

### 3. Créer virement
```bash
POST /api/transactions/transfer
{
  "fromAccountId": "uuid-account",
  "toAccountId": "uuid-recipient",
  "amount": 150.50,
  "description": "Payment"
}
```
→ Transaction PENDING, attend validation admin

### 4. Validation admin
```bash
PATCH /api/transactions/:id/validate
{
  "approved": true
}
```
→ Soldes mis à jour automatiquement

## Sécurité

- Passwords hashés avec bcrypt
- JWT tokens avec expiration
- Row Level Security (RLS) sur toutes les tables
- Validation des données avec class-validator
- Guards NestJS (JwtAuthGuard + RolesGuard)

## Développement futur

- Frontend React client dashboard
- Admin panel React-Admin
- Notifications temps réel
- 2FA authentification
- Support multi-devises
- Export PDF relevés

## Licence

MIT
