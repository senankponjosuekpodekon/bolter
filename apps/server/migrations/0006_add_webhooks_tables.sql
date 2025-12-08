-- Migration: Add Webhooks and Webhook Deliveries Tables
-- Created: 2025-12-06
-- Description: Adds support for webhook integrations

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    response_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for webhooks updated_at
CREATE TRIGGER update_webhooks_updated_at 
    BEFORE UPDATE ON webhooks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON webhook_deliveries TO authenticated;

-- Comments
COMMENT ON TABLE webhooks IS 'Stores webhook configurations for external integrations';
COMMENT ON TABLE webhook_deliveries IS 'Tracks webhook delivery attempts and status';
COMMENT ON COLUMN webhooks.secret IS 'Secret key used to sign webhook payloads (HMAC-SHA256)';
COMMENT ON COLUMN webhooks.events IS 'Array of event types this webhook subscribes to';
COMMENT ON COLUMN webhook_deliveries.payload IS 'The full payload sent to the webhook URL';
