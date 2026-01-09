-- Migration: Create Tenants and Licenses Tables
-- Sprint 2: Multi-Tenancy & Licensing System

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  starts_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  modules JSONB DEFAULT '{"accounts": true, "transactions": true, "loans": false, "cards": false, "tontines": false}',
  limits JSONB DEFAULT '{"monthly_transactions": 10000, "api_calls": 100000, "storage_gb": 10, "active_users": 50}',
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create license_history table for auditing
CREATE TABLE IF NOT EXISTS license_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL CHECK (action IN ('CREATED', 'RENEWED', 'UPGRADED', 'DOWNGRADED', 'EXPIRED', 'CANCELLED')),
  old_tier VARCHAR(50),
  new_tier VARCHAR(50),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL, -- 2025-12
  feature VARCHAR(100) NOT NULL, -- 'loans', 'cards', 'tontines', 'api_calls', 'storage_gb'
  count INT DEFAULT 0,
  limit_value INT,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_usage_per_month UNIQUE (tenant_id, year_month, feature)
);

-- 5. Add tenant_id to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tontine_members ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tontine_contributions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_licenses_tenant_id ON licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
-- Partial index to enforce unique active license per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_license_per_tenant ON licenses(tenant_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_license_history_tenant_id ON license_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant_month ON usage_tracking(tenant_id, year_month);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tontines_tenant_id ON tontines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_tenant_id ON kyc_documents(tenant_id);

-- 7. Enable RLS on all multi-tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies: Example for tenants table (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'tenants_owner_access'
  ) THEN
    DROP POLICY tenants_owner_access ON tenants;
  END IF;
END;
$$;

CREATE POLICY tenants_owner_access ON tenants
  USING (id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  WITH CHECK (id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1));

-- RLS Policies: licenses table (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'licenses' AND policyname = 'licenses_tenant_isolation'
  ) THEN
    DROP POLICY licenses_tenant_isolation ON licenses;
  END IF;
END;
$$;

CREATE POLICY licenses_tenant_isolation ON licenses
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1));

-- RLS Policies: license_history table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'license_history' AND policyname = 'license_history_tenant_isolation'
  ) THEN
    DROP POLICY license_history_tenant_isolation ON license_history;
  END IF;
END;
$$;

CREATE POLICY license_history_tenant_isolation ON license_history
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1));

-- RLS Policies: usage_tracking table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'usage_tracking' AND policyname = 'usage_tracking_tenant_isolation'
  ) THEN
    DROP POLICY usage_tracking_tenant_isolation ON usage_tracking;
  END IF;
END;
$$;

CREATE POLICY usage_tracking_tenant_isolation ON usage_tracking
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1));

-- 9. RLS Policies: Users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_tenant_isolation'
  ) THEN
    DROP POLICY users_tenant_isolation ON users;
  END IF;
END;
$$;

CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1));

-- 10. Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Seed initial tenant for testing (optional)
INSERT INTO tenants (name, slug, subdomain, contact_email, status)
VALUES ('Default Tenant', 'default', 'default', 'admin@platform.local', 'ACTIVE')
ON CONFLICT (slug) DO NOTHING;

-- Create default STARTER license
INSERT INTO licenses (tenant_id, tier, expires_at, modules, limits, status)
SELECT id, 'STARTER', NOW() + INTERVAL '30 days', 
  '{"accounts": true, "transactions": true, "loans": false, "cards": false, "tontines": false}',
  '{"monthly_transactions": 10000, "api_calls": 100000, "storage_gb": 1, "active_users": 5}',
  'ACTIVE'
FROM tenants
WHERE slug = 'default'
AND NOT EXISTS (SELECT 1 FROM licenses WHERE tenant_id = tenants.id AND status = 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Grant permissions to app user
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON licenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON license_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_tracking TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
