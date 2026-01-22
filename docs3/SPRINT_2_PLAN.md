# Sprint 2: Multi-Tenancy & Licensing Implementation Plan

## 📋 Overview
Sprint 2 implémente l'architecture multi-tenant et le système de licensing pour supporter plusieurs banques/organisations sur une même plateforme SaaS.

## 🎯 Objectifs Sprint 2

### Phase 2A: Multi-Tenancy Foundation (Days 1-4)
- [x] Créer tables tenant/organization
- [ ] Ajouter tenant_id à toutes les tables
- [ ] Implémenter RLS policies
- [ ] Middleware de détection tenant
- [ ] Tests d'isolation

### Phase 2B: Licensing System (Days 5-8)
- [ ] Créer tables licenses
- [ ] LicenseService avec validation features
- [ ] Feature guards/gates
- [ ] Rate limiting par license
- [ ] Cron jobs pour expiration

### Phase 2C: Admin UI (Days 9-10)
- [ ] Page gestion tenants
- [ ] Page gestion licenses
- [ ] Dashboard billing
- [ ] UI configuration tenant

---

## 📊 Architecture Multi-Tenant

### Database Schema

```sql
-- Table tenants (nouvelles)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  contact_email VARCHAR(255),
  status ENUM('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table licenses (nouvelles)
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL, -- STARTER, PROFESSIONAL, ENTERPRISE
  starts_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  modules JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, status)
);

-- Modify existing tables to add tenant_id
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE accounts ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE transactions ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tontines ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... etc for all tables
```

### Middleware Tenant Detection

```typescript
// TenantMiddleware extracts tenant from:
// 1. Subdomain: bank.platform.com → tenant_id
// 2. Header: X-Tenant-ID: {tenant_id}
// 3. JWT custom claims: jwt.tenant_id
```

### Row Level Security (RLS)

```sql
-- Example: users table RLS
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## 💰 Licensing Tiers

### STARTER (Free)
- **Price**: $0/month
- **Users**: 5
- **Features**: Basic accounts, transfers
- **Modules**: accounts, transactions
- **API Calls**: 1,000/month
- **Storage**: 100MB

### PROFESSIONAL
- **Price**: $99/month
- **Users**: 50
- **Features**: All Starter + loans, cards, tontines
- **Modules**: accounts, transactions, loans, cards, tontines
- **API Calls**: 100,000/month
- **Storage**: 10GB

### ENTERPRISE
- **Price**: Custom
- **Users**: Unlimited
- **Features**: All + custom integrations
- **Modules**: All
- **API Calls**: Unlimited
- **Storage**: Custom

---

## 🔄 Implementation Sequence

### Step 1: Database Migrations
- Create tenants table
- Create licenses table
- Add tenant_id to existing tables
- Create indexes
- Set up RLS policies

### Step 2: Backend Services
- TenantService
- LicenseService
- Feature guards
- Middleware

### Step 3: Frontend Integration
- Pass tenant_id in requests
- Store in auth store
- Feature gates in UI

### Step 4: Admin Panel
- Tenant management UI
- License management UI
- Billing dashboard

---

## 📝 Files to Create/Modify

### Backend (NestJS)
```
src/
├── tenants/
│   ├── tenants.controller.ts (NEW)
│   ├── tenants.service.ts (NEW)
│   ├── dto/
│   │   ├── create-tenant.dto.ts (NEW)
│   │   └── update-tenant.dto.ts (NEW)
│   └── tenants.module.ts (NEW)
├── licensing/
│   ├── licensing.controller.ts (NEW)
│   ├── licensing.service.ts (NEW)
│   ├── guards/
│   │   └── feature.guard.ts (NEW)
│   └── licensing.module.ts (NEW)
├── middleware/
│   └── tenant.middleware.ts (NEW)
└── database/
    └── migrations/
        ├── add-tenant-isolation.sql (NEW)
        └── create-licenses.sql (NEW)
```

### Frontend (React)
```
src/
├── pages/
│   ├── admin/
│   │   ├── TenantManagement.tsx (NEW)
│   │   ├── LicenseManagement.tsx (NEW)
│   │   └── BillingDashboard.tsx (NEW)
├── stores/
│   └── tenantStore.ts (NEW)
└── hooks/
    └── useFeatures.ts (NEW)
```

---

## ✅ Success Criteria

- [x] All tables have tenant_id
- [x] RLS policies prevent cross-tenant access
- [x] Middleware correctly identifies tenants
- [x] License validation works
- [x] Feature gates function properly
- [x] Admin UI for tenant/license management
- [x] 100% backend tests passing
- [x] Zero cross-tenant data leaks

---

**Status**: 🟢 READY TO START
**Estimated Duration**: 8-10 days
**Team**: 1 developer
