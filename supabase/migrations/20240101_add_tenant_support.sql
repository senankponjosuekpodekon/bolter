-- ============================================================
-- MIGRATION: Multi-tenant support
-- Adds tenant table + tenant_id FK on all user-scoped tables
-- Safe to run on existing data (default tenant created first)
-- ============================================================

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,            -- e.g. "bolter", "bnpparibas"
  domain      TEXT,                            -- e.g. "bolter.app" (for subdomain routing)
  logo_url    TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  support_email TEXT,
  plan        TEXT NOT NULL DEFAULT 'FREE',    -- FREE | PRO | ENTERPRISE
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  config      JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Add missing columns if tenants table already existed
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url       TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color  TEXT DEFAULT '#2563eb';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS support_email  TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan           TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS config         JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

-- 2. Insert default tenant (all existing data belongs to it)
INSERT INTO tenants (id, name, slug, support_email, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Bolter Banking',
  'bolter',
  'support@bolter.app',
  'ENTERPRISE'
) ON CONFLICT (id) DO NOTHING;

-- 3. Add tenant_id to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 4. Add tenant_id to accounts
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE accounts SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 5. Add tenant_id to transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE transactions SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 6. Add tenant_id to loans
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE loans SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 7. Add tenant_id to cards
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE cards SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 8. Add tenant_id to tontines
ALTER TABLE tontines
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE tontines SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 9. Add tenant_id to kyc_documents
ALTER TABLE kyc_documents
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE kyc_documents SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 10. Add tenant_id to audit_logs
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE audit_logs SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 11. Add tenant_id to system_config (rename to tenant_config)
ALTER TABLE system_config
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

UPDATE system_config SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- 12. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id        ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id     ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loans_tenant_id        ON loans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cards_tenant_id        ON cards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tontines_tenant_id     ON tontines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id   ON audit_logs(tenant_id);
