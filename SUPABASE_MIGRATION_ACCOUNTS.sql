-- Add missing columns to accounts table in Supabase
-- Execute this SQL in your Supabase SQL Editor (https://app.supabase.com)

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "limit" DECIMAL(10, 2) DEFAULT 1000;

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE INDEX IF NOT EXISTS idx_accounts_limit ON accounts("limit");
