# Banking Platform - Full Stack Monorepo

Plateforme bancaire complète avec Backend NestJS et Frontend React (client + admin intégré).

## 📊 État actuel (juin 2026)

**Code Quality:**

- ✅ Lint : 0 erreurs
- ✅ TypeScript : 0 erreurs de type
- ✅ Builds : server + client OK

**Tests:**

- ✅ Backend : 66/66 passing
- ✅ Frontend : Dashboard (5), Accounts (6), Loans, Profile, KYC, 2FA

## 🏗️ Architecture Monorepo

```
bolter/
├── apps/
│   ├── server/          # Backend NestJS + Supabase (port 3000)
│   └── client/          # Frontend React + Vite (port 5173)
│       └── src/admin/   # Admin panel intégré (route /admin)
├── supabase/            # Scripts SQL (sécurité, RLS)
├── docker-compose.yml   # Orchestration prod
├── ngrok.yml            # Config tunnels dev
└── scripts/
    └── start-ngrok.sh   # Démarrage dev avec tunnel public
```

## 🚀 Démarrage rapide

### Développement local

```bash
npm install
npm run dev          # server (3000) + client (5173)
```

Accès :
- Client : http://localhost:5173
- Admin : http://localhost:5173/admin
- Swagger : http://localhost:3000/api/docs

### Développement avec ngrok (accès mobile / URL publique)

```bash
npm run start:ngrok
```

Le script démarre automatiquement le server, le tunnel ngrok et le client Vite.  
L'URL publique est affichée dans le terminal — le même tunnel sert client, admin et API via le proxy Vite.

### Production avec Docker

```bash
# Copier et remplir les variables d'environnement
cp apps/server/.env.example apps/server/.env

# Lancer
docker compose up --build
```

Accès :
- Client + Admin : http://localhost:80
- Server : http://localhost:3000 (interne uniquement)

En prod avec un vrai domaine, placer un reverse proxy (Caddy / Traefik / Nginx) devant pour le HTTPS automatique.

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

### 2. Client + Admin (apps/client/) - Port 5173

**React 18 + TypeScript + Vite + Tailwind CSS**

**Routes :**
- `/login` `/register` — Auth
- `/dashboard` — Vue d'ensemble (soldes, transactions, widgets configurables)
- `/accounts` — Comptes bancaires + cartes
- `/transactions` — Transfer / Deposit / Withdraw
- `/loans` — Prets + simulateur
- `/tontines` — Tontines (creation, membres, contributions)
- `/profile` — Profil editable, KYC, 2FA, preferences widgets
- `/admin/*` — Panel admin React-Admin (ADMIN/COMPLIANCE uniquement)

**Features cles :**
- Refresh token silencieux (intercepteur axios, queue de requetes)
- Timeout axios 15s + toast reseau automatique
- Rate limiting formulaires auth (debounce + cooldown 429)
- Preferences (theme, widgets) persistees en base
- Responsive complet : bottom nav mobile, drawer, `--vh` fix iOS
- Dark mode, i18n (fr/en)


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

```bash
npm run dev              # server + client (dev)
npm run dev:server       # server uniquement
npm run dev:client       # client uniquement
npm run build            # build server + client
npm run build:server     # build server
npm run build:client     # build client
npm run test             # tests tous les workspaces
npm run lint             # lint server + client
npm run start:ngrok      # dev avec tunnel ngrok public
```

## 🔧 Configuration

### Variables d'environnement

Créer `apps/server/.env` :

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=notifications@your-domain.com

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> En production Docker, `FRONTEND_URL` doit pointer vers le domaine réel pour que CORS fonctionne.

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

### Outils pour les développeurs

- TypeScript (dev): 5.9.3 — les workspaces sont alignés sur cette version
- ESLint + @typescript-eslint: >= 8.47.0

Si vous venez de puller ces changements, rafraîchissez votre installation locale pour éviter des incompatibilités de parser/eslint :

```bash
# supprimer et réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# vérifier l'état du linter
npm run lint
```

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

## 🧪 Local LAN development & Mobile testing

Pour tester l'application depuis un téléphone sur le même réseau local (Wi‑Fi), voici les options et commandes recommandées. Ces notes couvrent les récents changements : le backend peut démarrer en HTTPS si `USE_HTTPS=true`, sinon il bascule en HTTP (mode dev). Le serveur vérifie la présence des certificats dans `apps/server/cert` et affiche un avertissement si les fichiers manquent.

Choix rapide:

- Développement simple (recommandé) : utiliser HTTP pour le backend et lancer le frontend sur la machine; accéder au front depuis le téléphone via `http://<IP_MACHINE>:5173`.
- HTTPS local : générer un certificat mkcert couvrant l'IP et activer `USE_HTTPS=true` (plus d'étapes).
- Tunnel public : utiliser `ngrok` si tu veux une URL HTTPS publique sans gérer de certificats locaux.

1. Démarrage rapide (HTTP, le plus simple)

```bash
# Backend en HTTP (dev)
export USE_HTTPS=false
npm run --prefix apps/server dev

# Frontend (client)
export VITE_API_URL=http://192.168.1.199:3000   # optionnel : utile si tu builds le front ou veux pointer explicitement l'API
npm run --prefix apps/client dev

```

Ensuite sur ton téléphone (même Wi‑Fi) : (modi de viturl dans .env et main.ts serveur file)

- Front client : `http://192.168.1.199:5173`
- Admin : `http://192.168.1.199:5173/admin`
- Swagger backend : `http://192.168.1.199:3000/api/docs`

Remarques :

- La configuration de développement de `apps/client` utilise une proxy Vite (`/api -> http://localhost:3000`) ; si tu ouvres le front depuis le téléphone sur le dev‑server Vite, les appels `/api` sont proxifiés par Vite vers le backend (pas de CORS côté téléphone).
- Si tu builds le front et sers les fichiers statiques, définis `VITE_API_URL=http://192.168.1.199:3000` pour que les requêtes API pointent vers la machine.

2. Activer HTTPS local (mkcert) — utile si tu veux HTTPS depuis le téléphone

Pré requis : `mkcert` installé. Exemples de commandes :

```bash
cd apps/server/cert
mkcert -install
# Génère une paire cert+key couvrant localhost et l'IP
mkcert localhost 192.168.1.199

# Cela crée des fichiers comme: localhost+1.pem et localhost+1-key.pem
```

Puis lancer le backend en HTTPS :

```bash
export USE_HTTPS=true
npm run --prefix apps/server dev
```

Le serveur lit les certificats depuis `apps/server/cert` et utilisera les fichiers présents. Si `USE_HTTPS=true` mais que les fichiers sont absents, le serveur bascule automatiquement en HTTP et écrit un avertissement au démarrage.

3. Utiliser un tunnel HTTPS public (ngrok)

```bash
# Option 1: Tunnel simple (port 3000)
ngrok http 3000

# Option 2: Script du projet (recommandé)
npm run start:ngrok

# Option 3: Tunnel uniquement
npm run tunnel
```

**Script `start:ngrok`**:
- Démarre automatiquement le serveur API (port 3000)
- Crée un tunnel ngrok HTTPS public
- Affiche l'URL publique à utiliser

**Dépannage ngrok**:
- Si le tunnel ne démarre pas, vérifiez que ngrok est installé: `npm install -g ngrok`
- Si l'URL n'est pas récupérée, patientez jusqu'à 30 secondes
- Vérifiez votre connexion internet
- Assurez-vous que le port 3000 n'est pas déjà utilisé

Le script utilise `scripts/start-ngrok.sh` et crée un tunnel vers le port `3000` par défaut. ngrok fournit une URL HTTPS publique que vous pouvez utiliser depuis votre téléphone ou pour partager l'API.

4. Firewall / réseau

Assure-toi que les ports sont ouverts et que ton téléphone et ton ordinateur sont sur le même réseau Wi‑Fi :

```bash
ss -tln | egrep '5173|5174|3000' || true
sudo ufw allow 5173/tcp
sudo ufw allow 5174/tcp
sudo ufw allow 3000/tcp
sudo ufw status
```

5. Notes sur les récentes modifications du backend

- Le backend supporte la variable d'environnement `USE_HTTPS` : si `true` il tente de démarrer en HTTPS en lisant les certificats depuis `apps/server/cert` (ex. `192.168.1.199.pem` et `192.168.1.199-key.pem`).
- Si les certificats ne sont pas trouvés, le serveur écrit un avertissement et démarre en HTTP (pratique en dev).
- En mode HTTP le serveur désactive certaines en‑têtes strictes (`Cross-Origin-Opener-Policy`, `Origin-Agent-Cluster`) afin d'éviter les warnings de navigateur et les tentatives de chargement forcé d'actifs en HTTPS (utile pour Swagger UI en dev mobile).
- Swagger UI est servi via une URL relative afin que les assets suivent le même protocole que la page (évite `ERR_SSL_PROTOCOL_ERROR` quand tu accèdes via HTTP).

Si tu veux que j'ajoute un script `dev:lan` pour démarrer client+server en une seule commande, ou que j'automatise la génération mkcert et le placement des fichiers, dis‑le et je le ferai.

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

## 🔐 Sécurité

### Authentification & Autorisation

- Passwords hashés avec bcrypt
- JWT access token (1h) + refresh token silencieux (7j)
- CORS restrictif : liste blanche `FRONTEND_URL` + ngrok
- Rate limiting : login (10/15min), password reset (3/h) côté serveur
- Rate limiting formulaires : debounce + cooldown 429 côté client
- Row Level Security (RLS) sur toutes les tables Supabase
- GraphQL anon/authenticated accès révoqué (voir `supabase/security-fix.sql`)
- Validation class-validator + Guards NestJS (JwtAuthGuard + RolesGuard)

### Two-Factor Authentication (2FA)

- TOTP (Time-based One-Time Password) avec speakeasy
- Génération dynamique de secrets avec codes QR
- Persistence de secrets temporaires pour le flux setup → enable
- Support de tous les authenticateurs standards (Google Authenticator, Microsoft Authenticator, Authy, etc.)
- Documentation complète: `docs/2FA-IMPLEMENTATION.md` et `docs/2FA-FRONTEND-GUIDE.md`

**Endpoints 2FA**:

- `POST /auth/2fa/setup` - Initier la configuration 2FA
- `POST /auth/2fa/enable` - Activer 2FA après vérification du code
- `POST /auth/2fa/disable` - Désactiver 2FA avec vérification du code
- `POST /auth/login` - Login adapté pour supporter 2FA

**Flux 2FA**:

1. User lance Setup 2FA → reçoit secret + QR code
2. User scanne QR avec authenticateur et obtient un code
3. User confirme Enable 2FA avec le code
4. Pour les logins suivants, user doit fournir le code après email/password

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

### 🚧 Améliorations futures

**DevOps :**
- [ ] CI/CD GitHub Actions (lint + test + build Docker)
- [ ] Health check endpoint `/api/health`
- [ ] Monitoring (Sentry, Datadog)

**Backend :**
- [ ] Notifications email (transactions validées, KYC reviewed)
- [ ] Export PDF relevés de compte
- [ ] 2FA par SMS/email en alternative TOTP

**Frontend :**
- [ ] Tests e2e Playwright
- [ ] Graphiques analytics Dashboard
- [ ] Export CSV/PDF données
- [ ] Accessibilité WCAG 2.1 (focus trap drawer mobile)

## 📖 Documentation

- `README.md` — Ce fichier
- `supabase/security-fix.sql` — Script SQL sécurité (à exécuter dans Supabase SQL Editor)
- `apps/server/src/` — Code NestJS annoté
- `apps/client/src/admin/` — Panel admin React-Admin
- Swagger : http://localhost:3000/api/docs (en dev)

## 🤝 Contribution

Ce projet est une plateforme bancaire complète avec:

- Validation manuelle des transactions par des admins
- Workflow KYC avec review par compliance
- Audit trail complet pour la conformité réglementaire

## 📄 Licence

MIT
