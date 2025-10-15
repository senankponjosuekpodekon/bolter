# Banking Platform - Full Stack Monorepo

Plateforme bancaire complète avec Backend NestJS, Frontend Client React, et Admin Panel React-Admin.

## 🏗️ Structure Monorepo

```
banking-platform/
├── apps/
│   ├── server/          # Backend NestJS + Supabase
│   ├── client/          # Frontend Client React
│   └── admin/           # Admin Panel React-Admin
├── package.json         # Root workspace
└── README.md
```

## ✅ Ce qui est implémenté

### Backend (apps/server/)
- ✅ NestJS + TypeScript + Supabase
- ✅ Auth (JWT + Google OAuth)
- ✅ Users, Accounts, Transactions, KYC modules
- ✅ **Validation admin obligatoire des transactions**
- ✅ **Workflow KYC avec review**
- ✅ Row Level Security (RLS)
- ✅ Swagger docs: http://localhost:3000/api/docs

### Frontend Client (apps/client/)
- ✅ React + TypeScript + Vite + Tailwind
- ✅ Login / Register
- ✅ Dashboard (soldes + transactions)
- ✅ Création virements (status PENDING)
- ✅ Upload documents KYC
- ✅ TanStack Query + Zustand

### Admin Panel (apps/admin/)
- ✅ React-Admin + TypeScript
- ✅ Authentication (Admin/Compliance only)
- ✅ **Validation transactions** (Approve/Reject) ⭐
- ✅ **Review documents KYC** (Approve/Reject) ⭐
- ✅ Gestion utilisateurs (CRUD + rôles)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start all apps
npm run dev
```

**URLs**:
- Server: http://localhost:3000
- Client: http://localhost:5173
- Admin: http://localhost:5174

## 🔐 Workflows Principaux

### Transaction avec Validation
1. Client crée virement → PENDING
2. Admin valide → APPROVED (soldes mis à jour) ou REJECTED

### KYC avec Review
1. Client upload docs → PENDING
2. Compliance review → APPROVED/REJECTED
3. Statut KYC utilisateur mis à jour auto

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

## 📋 Détails complets

Voir documentation complète dans:
- `apps/server/README.md` - Backend
- `IMPLEMENTATION.md` - Détails implémentation
- `MISSING_FEATURES.md` - Ce qui manque

## Licence

MIT
