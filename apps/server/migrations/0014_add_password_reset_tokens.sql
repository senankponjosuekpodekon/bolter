-- Add password_reset_token and expiry columns to users table
-- This allows storing reset tokens directly in the users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.password_reset_token IS 'One-time token for password reset flow';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for reset token (typically 1 hour)';
