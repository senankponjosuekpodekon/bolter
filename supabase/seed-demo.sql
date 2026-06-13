-- =============================================================================
-- DEMO SEED DATA
-- Passwords are all: Demo1234!
-- bcrypt hash of "Demo1234!" with 10 rounds
-- Run: psql $DATABASE_URL -f supabase/seed-demo.sql
-- =============================================================================

-- Clean existing demo data (idempotent)
DELETE FROM audit_logs        WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.bolter.app');
DELETE FROM transactions      WHERE from_account_id IN (SELECT id FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.bolter.app'))
                           OR to_account_id   IN (SELECT id FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.bolter.app'));
DELETE FROM cards             WHERE account_id   IN (SELECT id FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.bolter.app'));
DELETE FROM accounts          WHERE user_id      IN (SELECT id FROM users WHERE email LIKE '%@demo.bolter.app');
DELETE FROM users             WHERE email LIKE '%@demo.bolter.app';

-- =============================================================================
-- EXTEND ENUM (safe: IF NOT EXISTS equivalent via exception catch)
-- =============================================================================

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- =============================================================================
-- USERS
-- =============================================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, kyc_status, locale, currency, timezone)
VALUES
  -- Super Admin
  ('00000000-0000-0000-0000-000000000001',
   'superadmin@demo.bolter.app',
   '$2b$10$859ihdQF5rWFdDv2kLhSSuq09eFdD3aK0ohMjN9DQXimnm5vgL.wm', -- Demo1234!
   'Super', 'Admin', 'SUPER_ADMIN', 'ACTIVE', 'APPROVED', 'fr-FR', 'EUR', 'Europe/Paris'),

  -- Admin
  ('00000000-0000-0000-0000-000000000002',
   'admin@demo.bolter.app',
   '$2b$10$859ihdQF5rWFdDv2kLhSSuq09eFdD3aK0ohMjN9DQXimnm5vgL.wm',
   'Marie', 'Dupont', 'ADMIN', 'ACTIVE', 'APPROVED', 'fr-FR', 'EUR', 'Europe/Paris'),

  -- Compliance
  ('00000000-0000-0000-0000-000000000003',
   'compliance@demo.bolter.app',
   '$2b$10$859ihdQF5rWFdDv2kLhSSuq09eFdD3aK0ohMjN9DQXimnm5vgL.wm',
   'Jean', 'Martin', 'COMPLIANCE', 'ACTIVE', 'APPROVED', 'fr-FR', 'EUR', 'Europe/Paris'),

  -- Demo client 1 — full KYC, active
  ('00000000-0000-0000-0000-000000000010',
   'alice@demo.bolter.app',
   '$2b$10$859ihdQF5rWFdDv2kLhSSuq09eFdD3aK0ohMjN9DQXimnm5vgL.wm',
   'Alice', 'Bernard', 'CLIENT', 'ACTIVE', 'APPROVED', 'fr-FR', 'EUR', 'Europe/Paris'),

  -- Demo client 2 — KYC pending
  ('00000000-0000-0000-0000-000000000011',
   'bob@demo.bolter.app',
   '$2b$10$859ihdQF5rWFdDv2kLhSSuq09eFdD3aK0ohMjN9DQXimnm5vgL.wm',
   'Bob', 'Leclerc', 'CLIENT', 'ACTIVE', 'PENDING', 'en-US', 'USD', 'America/New_York')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ACCOUNTS
-- =============================================================================

INSERT INTO accounts (id, user_id, account_number, account_type, balance, currency, status)
VALUES
  -- Alice: checking + savings
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000010',
   'FR76 3000 6000 0112 3456 7890 189', 'CHECKING', 4823.50, 'EUR', 'ACTIVE'),
  ('10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000010',
   'FR76 3000 6000 0198 7654 3210 543', 'SAVINGS', 12400.00, 'EUR', 'ACTIVE'),

  -- Bob: checking
  ('10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000011',
   'FR76 3000 6000 0155 5555 5555 555', 'CHECKING', 980.00, 'USD', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- TRANSACTIONS (Alice — checking account)
-- =============================================================================

-- (id, from_account_id, to_account_id, type, amount, currency, description, status, created_at)
INSERT INTO transactions (id, from_account_id, to_account_id, type, amount, currency, description, status, created_at)
VALUES
  -- Salary (DEPOSIT: no from, to = checking)
  ('20000000-0000-0000-0000-000000000001',
   NULL, '10000000-0000-0000-0000-000000000001',
   'DEPOSIT', 2800.00, 'EUR', 'Virement salaire — juin 2026', 'APPROVED',
   NOW() - INTERVAL '2 days'),

  -- Rent (WITHDRAWAL: from = checking, no to)
  ('20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001', NULL,
   'WITHDRAWAL', 850.00, 'EUR', 'Loyer juin 2026', 'APPROVED',
   NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),

  -- Groceries (WITHDRAWAL)
  ('20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001', NULL,
   'WITHDRAWAL', 124.30, 'EUR', 'Supermarché Carrefour', 'APPROVED',
   NOW() - INTERVAL '4 days'),

  -- Transfer to Bob (TRANSFER: from = alice checking, to = bob checking)
  ('20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
   'TRANSFER', 200.00, 'EUR', 'Remboursement diner — Bob', 'APPROVED',
   NOW() - INTERVAL '6 days'),

  -- Pending withdrawal
  ('20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000001', NULL,
   'WITHDRAWAL', 450.00, 'EUR', 'Achat matériel informatique', 'PENDING',
   NOW() - INTERVAL '1 hour'),

  -- Savings deposit
  ('20000000-0000-0000-0000-000000000006',
   NULL, '10000000-0000-0000-0000-000000000002',
   'DEPOSIT', 500.00, 'EUR', 'Épargne mensuelle automatique', 'APPROVED',
   NOW() - INTERVAL '3 days'),

  -- Old salary (for dashboard chart)
  ('20000000-0000-0000-0000-000000000007',
   NULL, '10000000-0000-0000-0000-000000000001',
   'DEPOSIT', 2800.00, 'EUR', 'Virement salaire — mai 2026', 'APPROVED',
   NOW() - INTERVAL '32 days'),

  ('20000000-0000-0000-0000-000000000008',
   '10000000-0000-0000-0000-000000000001', NULL,
   'WITHDRAWAL', 320.00, 'EUR', 'EDF Électricité', 'APPROVED',
   NOW() - INTERVAL '35 days'),

  ('20000000-0000-0000-0000-000000000009',
   '10000000-0000-0000-0000-000000000001', NULL,
   'WITHDRAWAL', 89.99, 'EUR', 'Abonnement Netflix + Spotify', 'APPROVED',
   NOW() - INTERVAL '38 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SYSTEM CONFIG (for SUPER_ADMIN panel)
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO system_config (key, value) VALUES
  ('max_accounts_per_user',   '{"value": 3, "description": "Max checking+savings accounts per client"}'),
  ('max_cards_per_account',   '{"value": 2, "description": "Max cards per account"}'),
  ('transaction_daily_limit', '{"value": 5000, "description": "Daily withdrawal limit in EUR"}'),
  ('loan_max_amount',         '{"value": 50000, "description": "Maximum loan amount in EUR"}'),
  ('loan_interest_rate',      '{"value": 4.5, "description": "Default annual interest rate (%)"}'),
  ('kyc_required_for_loan',   '{"value": true, "description": "Require approved KYC before loan request"}'),
  ('maintenance_mode',        '{"value": false, "description": "Put app in read-only maintenance mode"}')
ON CONFLICT (key) DO NOTHING;
