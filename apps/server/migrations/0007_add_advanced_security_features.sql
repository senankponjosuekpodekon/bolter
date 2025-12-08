-- Migration: Add Rate Limiting, Session Binding, Backup Codes, and Device Trust
-- Created: 2025-12-06
-- Description: Advanced security features for Sprint V

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    ip_address TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_sessions table for session binding
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    device_fingerprint TEXT,
    is_trusted_device BOOLEAN NOT NULL DEFAULT false,
    trusted_until TIMESTAMPTZ,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

-- Create backup_codes table
CREATE TABLE IF NOT EXISTS backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create otp_codes table for SMS/Email OTP
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('sms', 'email')),
    phone_number TEXT,
    email TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_unused ON backup_codes(user_id, used_at) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_active ON otp_codes(user_id, verified_at, expires_at) WHERE verified_at IS NULL;

-- Add new columns to users table for 2FA enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes_generated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_2fa_method TEXT DEFAULT 'totp' CHECK (preferred_2fa_method IN ('totp', 'sms', 'email'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON backup_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON otp_codes TO authenticated;

-- Comments
COMMENT ON TABLE rate_limits IS 'Rate limiting for various user actions (2FA, login, etc.)';
COMMENT ON TABLE user_sessions IS 'Session tracking with IP/user-agent binding and device trust';
COMMENT ON TABLE backup_codes IS 'Backup codes for 2FA recovery (hashed)';
COMMENT ON TABLE otp_codes IS 'One-time passwords sent via SMS or email';
COMMENT ON COLUMN user_sessions.is_trusted_device IS 'Whether this device is trusted for 7 days';
COMMENT ON COLUMN user_sessions.device_fingerprint IS 'Browser fingerprint for device identification';
