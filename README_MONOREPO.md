# Banking Platform - Full Stack Monorepo

Plateforme bancaire complète avec Backend NestJS, Frontend Client React, et Admin Panel React-Admin.

## 🏗️ Structure Monorepo

```
banking-platform/
├── apps/
│   ├── server/          # Backend NestJS + Supabase
│   ├── client/          # Frontend Client React
│   └── admin/           # Admin Panel React-Admin
├── src/                 # Modules partagés, DTOs, logique métier
├── package.json         # Root workspace
├── README.md
├── README_MONOREPO.md
├── IMPLEMENTATION.md
├── MISSING_FEATURES.md
```

## ✅ Ce qui est implémenté

### Backend (apps/server/)
- ✅ NestJS + TypeScript + Supabase
- ✅ Auth (JWT + Google OAuth)
- ✅ Users, Accounts, Transactions, KYC modules
- ✅ **Validation admin obligatoire des transactions**
- ✅ **Workflow KYC avec review**
- ✅ Row Level Security (RLS)
- ✅ Password policies, audit logging, session management, token blacklist, rate limiting
- ✅ Swagger docs: http://localhost:3000/api/docs

### Frontend Client (apps/client/)
- ✅ React + TypeScript + Vite + Tailwind
- ✅ Login / Register
- ✅ Dashboard (soldes + transactions)
- ✅ Création virements (status PENDING)
- ✅ Dépôt/retrait (à venir)
- ✅ Upload documents KYC
- ✅ Profil (affichage, édition, préférences)
- ✅ Activité utilisateur (historique)
- ✅ TanStack Query + Zustand

### Admin Panel (apps/admin/)
- ✅ React-Admin + TypeScript
- ✅ Authentication (Admin/Compliance only)
- ✅ **Validation transactions** (Approve/Reject) ⭐
- ✅ **Review documents KYC** (Approve/Reject) ⭐
- ✅ Gestion utilisateurs (CRUD + rôles, édition IBAN)
- ✅ Audit log

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure Supabase (voir IMPLEMENTATION.md)

# Start all apps
npm run dev
```

**URLs**:
- Server: http://localhost:3000
- Client: http://localhost:5173
- Admin: http://localhost:5174

## 🔐 Workflows Principaux

### Transaction avec Validation
1. Client crée virement/dépôt/retrait → PENDING
2. Admin valide → APPROVED (soldes mis à jour) ou REJECTED

### KYC avec Review
1. Client upload docs → PENDING
2. Compliance review → APPROVED/REJECTED
3. Statut KYC utilisateur mis à jour auto

### Profil Utilisateur
1. Affichage et édition profil, préférences
2. Historique activité

### Admin
1. Gestion utilisateurs, comptes, IBAN
2. Validation transactions/dépôts/retraits
3. Audit log

## 📦 Scripts

```bash
npm run dev              # Start all
npm run dev:server       # Server only
npm run dev:client       # Client only
npm run dev:admin        # Admin only
npm run build            # Build all
```

## 🔧 Configuration

Créer `apps/server/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
PORT=3000
```

## 📋 Fonctionnalités Manquantes & Priorités

Voir `MISSING_FEATURES.md` pour la roadmap complète.
- Dépôts/retraits
- Vérification solde
- Édition profil utilisateur
- Menu admin conditionnel
- Admin édition IBAN
- Notifications, tests, Docker, CI/CD, multi-devises, compliance avancé

## 📋 Détails complets

Voir documentation complète dans:
- `README.md` - Vue d'ensemble, modules, installation
- `IMPLEMENTATION.md` - Détails backend, migrations
- `MISSING_FEATURES.md` - Roadmap, priorités

## Statut Global
- Backend : 95% (manque dépôts/retraits, solde check)
- Frontend Client : 80% (manque édition profil, dépôts/retraits)
- Admin Panel : 75% (manque dashboard, édition IBAN)
- Monorepo : 100%
- Notifications, 2FA, Tests, DevOps, Features avancées : 0-10%
- Total projet : ~75% COMPLET

## Licence

MIT
