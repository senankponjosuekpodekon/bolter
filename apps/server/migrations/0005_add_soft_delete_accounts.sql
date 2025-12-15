-- Add soft delete columns to accounts table for RGPD compliance
-- This allows data retention for 90 days after deletion before permanent removal

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deletion_reason VARCHAR(255) NULL;

-- Create index on deleted_at for fast queries on soft-deleted records
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_at ON accounts(deleted_at);

-- Create index for finding active (non-deleted) accounts
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(deleted_at, user_id) WHERE deleted_at IS NULL;

-- Add soft delete columns to users table (for full RGPD compliance)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason VARCHAR(255) NULL;

-- Create indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(deleted_at) WHERE deleted_at IS NULL;
