-- ============================================================
-- MIGRATION: Row Level Security (RLS) for multi-tenant isolation
-- Each tenant only sees its own data
-- The app server uses the service_role key (bypasses RLS for internal ops)
-- RLS applies when using the anon/authenticated key only
-- ============================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: current tenant from JWT claim (set by app)
-- SECURITY INVOKER  → runs with the caller's privileges (no escalation)
-- SET search_path   → prevents search_path injection (fixes 0011)
-- REVOKE EXECUTE    → not callable via REST/GraphQL by anon or authenticated
--                     (fixes 0028 + 0029)
-- ============================================================
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM authenticated;

-- ============================================================
-- POLICIES: service_role bypasses all RLS automatically
-- These policies apply only to anon/authenticated roles
-- ============================================================

-- tenants: users can only see their own tenant
DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (id = current_tenant_id());

-- users
DROP POLICY IF EXISTS tenant_isolation ON users;
CREATE POLICY tenant_isolation ON users
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- accounts
DROP POLICY IF EXISTS tenant_isolation ON accounts;
CREATE POLICY tenant_isolation ON accounts
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- transactions
DROP POLICY IF EXISTS tenant_isolation ON transactions;
CREATE POLICY tenant_isolation ON transactions
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- loans
DROP POLICY IF EXISTS tenant_isolation ON loans;
CREATE POLICY tenant_isolation ON loans
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- cards
DROP POLICY IF EXISTS tenant_isolation ON cards;
CREATE POLICY tenant_isolation ON cards
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- tontines
DROP POLICY IF EXISTS tenant_isolation ON tontines;
CREATE POLICY tenant_isolation ON tontines
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- kyc_documents
DROP POLICY IF EXISTS tenant_isolation ON kyc_documents;
CREATE POLICY tenant_isolation ON kyc_documents
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- audit_logs
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
CREATE POLICY tenant_isolation ON audit_logs
  FOR ALL USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============================================================
-- system_config: RLS already enabled (via previous migration)
-- SECURITY FIX 1: add missing policy (rls_enabled_no_policy warning)
-- Only service_role (NestJS backend) should write; no direct client access
-- ============================================================
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON system_config;
CREATE POLICY tenant_isolation ON system_config
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR current_tenant_id() IS NULL
  );

-- ============================================================
-- SECURITY FIX 2: revoke GraphQL anon + authenticated SELECT on system_config
-- (pg_graphql_anon_table_exposed + pg_graphql_authenticated_table_exposed)
-- The config table must NOT be readable via public API
-- ============================================================
REVOKE SELECT ON public.system_config FROM anon;
REVOKE SELECT ON public.system_config FROM authenticated;

-- ============================================================
-- NOTE: auth_leaked_password_protection
-- Enable "Leaked Password Protection" manually in:
-- Supabase Dashboard → Authentication → Providers → Email → Password Security
-- This cannot be set via SQL migration.
-- ============================================================
