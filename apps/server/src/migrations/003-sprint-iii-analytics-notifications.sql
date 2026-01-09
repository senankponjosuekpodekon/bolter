-- Sprint III: Advanced Analytics & Notifications Database Schema
-- This migration adds tables for analytics, performance monitoring, notifications preferences, and webhooks

-- Webhooks Table (base resource)
-- ============================================================================
-- Stores webhook endpoints registered by users/tenants

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);

-- ============================================================================
-- Webhook Deliveries Table (used by existing service)
-- ============================================================================
-- Tracks each delivery attempt initiated by WebhooksService

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  CONSTRAINT webhook_deliveries_status_valid CHECK (status IN ('pending', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);

-- ============================================================================
-- Notification Preferences Table
-- ============================================================================
-- Stores user preferences for notifications (channels, quiet hours, event types)

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Quiet hours (when notifications are suppressed, except critical)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),
  
  -- Event type subscriptions
  transaction_events BOOLEAN DEFAULT true,
  kyc_events BOOLEAN DEFAULT true,
  loan_events BOOLEAN DEFAULT true,
  system_events BOOLEAN DEFAULT true,
  report_events BOOLEAN DEFAULT true,
  
  -- Notification frequency
  notification_frequency VARCHAR(20) DEFAULT 'real_time', -- real_time, hourly, daily
  digest_time TIME DEFAULT '09:00', -- For digest notifications
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_id ON notification_preferences(tenant_id);

-- ============================================================================
-- Notifications Table (Audit Log)
-- ============================================================================
-- Stores all notifications sent to users for audit and replay

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL, -- transaction, kyc, loan, system, report
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional structured data
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  deleted BOOLEAN DEFAULT false,
  
  -- Delivery tracking
  channels_delivered JSONB, -- {email: true, in_app: true, sms: false}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT notifications_type_valid CHECK (type IN (
    'transaction', 'kyc', 'loan', 'system', 'report'
  ))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- Performance Metrics Table
-- ============================================================================
-- Stores API performance metrics for monitoring and analysis

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Request details
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE, etc.
  
  -- Performance data
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  error_message TEXT,
  
  -- Cache metrics
  cache_hit BOOLEAN DEFAULT false,
  
  -- Resource usage
  memory_used_mb NUMERIC(10, 2),
  cpu_usage_percent NUMERIC(5, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT metrics_response_time_positive CHECK (response_time_ms >= 0)
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_id ON performance_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_composite ON performance_metrics(tenant_id, endpoint, created_at DESC);

-- Create materialized view for performance summary (refresh every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS performance_summary AS
SELECT
  tenant_id,
  endpoint,
  method,
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) as request_count,
  ROUND(AVG(response_time_ms)::NUMERIC, 2) as avg_response_time_ms,
  ROUND(MAX(response_time_ms)::NUMERIC, 2) as max_response_time_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::NUMERIC, 2) as p95_response_time_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms)::NUMERIC, 2) as p99_response_time_ms,
  ROUND((SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as error_rate_percent,
  ROUND((SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as cache_hit_rate_percent
FROM performance_metrics
GROUP BY tenant_id, endpoint, method, DATE_TRUNC('hour', created_at);

CREATE INDEX IF NOT EXISTS idx_performance_summary_tenant_hour ON performance_summary(tenant_id, hour DESC);

-- ============================================================================
-- Webhook Events Table
-- ============================================================================
-- Stores webhook delivery logs for debugging and monitoring

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Delivery attempt
  delivery_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  last_error TEXT,
  
  -- Status
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT webhook_events_attempts_positive CHECK (delivery_attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_id ON webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_delivered ON webhook_events(delivered, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- ============================================================================
-- Webhook Delivery Logs Table
-- ============================================================================
-- Detailed logs for each delivery attempt

CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Request/Response details
  request_payload JSONB NOT NULL,
  response_status_code INTEGER,
  response_body TEXT,
  
  -- Timing
  request_timestamp TIMESTAMP NOT NULL,
  response_timestamp TIMESTAMP,
  duration_ms INTEGER,
  
  -- Retry info
  attempt_number INTEGER NOT NULL DEFAULT 1,
  retry_after_seconds INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook_id ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_event_id ON webhook_delivery_logs(webhook_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_created_at ON webhook_delivery_logs(created_at DESC);

-- ============================================================================
-- Analytics Reports Table
-- ============================================================================
-- Stores generated analytics reports for audit and replay

CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Report details
  name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- transactions, users, kyc, loans, accounts
  filters JSONB, -- Filter criteria used
  
  -- Data and export
  data JSONB NOT NULL,
  row_count INTEGER DEFAULT 0,
  
  -- Export formats
  exported_as JSONB, -- {csv: true, json: true, pdf: false}
  export_paths JSONB, -- {csv: 's3://...', json: 's3://...'}
  
  -- Metadata
  execution_time_ms INTEGER,
  cached BOOLEAN DEFAULT false,
  cache_expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_tenant_id ON analytics_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_created_by ON analytics_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_created_at ON analytics_reports(created_at DESC);

-- ============================================================================
-- Performance Alerts Table
-- ============================================================================
-- Stores performance-based alerts for monitoring

CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL, -- high_response_time, high_error_rate, low_cache_hit
  severity VARCHAR(20) NOT NULL DEFAULT 'warning', -- info, warning, critical
  
  -- Trigger details
  endpoint VARCHAR(255),
  threshold_value NUMERIC(10, 2),
  actual_value NUMERIC(10, 2),
  message TEXT NOT NULL,
  
  -- Status
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT alerts_severity_valid CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT alerts_type_valid CHECK (alert_type IN (
    'high_response_time', 'high_error_rate', 'low_cache_hit', 'memory_high', 'cpu_high'
  ))
);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_tenant_id ON performance_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON performance_alerts(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON performance_alerts(created_at DESC);

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
-- ============================================================================

DROP POLICY IF EXISTS webhooks_select ON webhooks;
CREATE POLICY webhooks_select ON webhooks
  FOR SELECT USING (
    auth.uid() = user_id
    OR tenant_id IS NULL
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS webhooks_insert ON webhooks;
CREATE POLICY webhooks_insert ON webhooks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR (tenant_id IS NOT NULL AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  );

DROP POLICY IF EXISTS webhooks_update ON webhooks;
CREATE POLICY webhooks_update ON webhooks
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (tenant_id IS NOT NULL AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  );

DROP POLICY IF EXISTS webhooks_delete ON webhooks;
CREATE POLICY webhooks_delete ON webhooks
  FOR DELETE USING (
    auth.uid() = user_id
    OR (tenant_id IS NOT NULL AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
  );

-- ============================================================================
-- RLS Policies for webhook_deliveries
-- ============================================================================

DROP POLICY IF EXISTS webhook_deliveries_select ON webhook_deliveries;
CREATE POLICY webhook_deliveries_select ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_id
      AND (
        w.user_id = auth.uid()
        OR (w.tenant_id IS NOT NULL AND w.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
      )
    )
  );

DROP POLICY IF EXISTS webhook_deliveries_insert ON webhook_deliveries;
CREATE POLICY webhook_deliveries_insert ON webhook_deliveries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_id
      AND (
        w.user_id = auth.uid()
        OR (w.tenant_id IS NOT NULL AND w.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
      )
    )
  );

DROP POLICY IF EXISTS webhook_deliveries_update ON webhook_deliveries;
CREATE POLICY webhook_deliveries_update ON webhook_deliveries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_id
      AND (
        w.user_id = auth.uid()
        OR (w.tenant_id IS NOT NULL AND w.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
      )
    )
  );

DROP POLICY IF EXISTS webhook_deliveries_delete ON webhook_deliveries;
CREATE POLICY webhook_deliveries_delete ON webhook_deliveries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_id
      AND (
        w.user_id = auth.uid()
        OR (w.tenant_id IS NOT NULL AND w.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1))
      )
    )
  );

-- =========================================================================
-- RLS Policies for webhook_events
-- =========================================================================

DROP POLICY IF EXISTS webhook_events_select ON webhook_events;
CREATE POLICY webhook_events_select ON webhook_events
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- =========================================================================
-- RLS Policies for webhook_delivery_logs
-- =========================================================================

DROP POLICY IF EXISTS webhook_delivery_logs_select ON webhook_delivery_logs;
CREATE POLICY webhook_delivery_logs_select ON webhook_delivery_logs
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS webhook_events_insert ON webhook_events;
CREATE POLICY webhook_events_insert ON webhook_events
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS webhook_events_update ON webhook_events;
CREATE POLICY webhook_events_update ON webhook_events
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS webhook_events_delete ON webhook_events;
CREATE POLICY webhook_events_delete ON webhook_events
  FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- RLS Policies for notification_preferences
-- ============================================================================

DROP POLICY IF EXISTS notification_preferences_select ON notification_preferences;
CREATE POLICY notification_preferences_select ON notification_preferences
  FOR SELECT USING (
    auth.uid() = user_id 
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS notification_preferences_insert ON notification_preferences;
CREATE POLICY notification_preferences_insert ON notification_preferences
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS notification_preferences_update ON notification_preferences;
CREATE POLICY notification_preferences_update ON notification_preferences
  FOR UPDATE USING (
    auth.uid() = user_id
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- RLS Policies for notifications
-- ============================================================================

DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS notifications_delete ON notifications;
CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (
    auth.uid() = user_id
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- =========================================================================
-- RLS Policies for performance_metrics
-- =========================================================================

DROP POLICY IF EXISTS performance_metrics_select ON performance_metrics;
CREATE POLICY performance_metrics_select ON performance_metrics
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS performance_metrics_insert ON performance_metrics;
CREATE POLICY performance_metrics_insert ON performance_metrics
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS performance_metrics_update ON performance_metrics;
CREATE POLICY performance_metrics_update ON performance_metrics
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS performance_metrics_delete ON performance_metrics;
CREATE POLICY performance_metrics_delete ON performance_metrics
  FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- =========================================================================
-- RLS Policies for performance_alerts
-- =========================================================================

DROP POLICY IF EXISTS performance_alerts_select ON performance_alerts;
CREATE POLICY performance_alerts_select ON performance_alerts
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS performance_alerts_insert ON performance_alerts;
CREATE POLICY performance_alerts_insert ON performance_alerts
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS performance_alerts_update ON performance_alerts;
CREATE POLICY performance_alerts_update ON performance_alerts
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS performance_alerts_delete ON performance_alerts;
CREATE POLICY performance_alerts_delete ON performance_alerts
  FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- =========================================================================
-- RLS Policies for analytics_reports
-- =========================================================================

DROP POLICY IF EXISTS analytics_reports_select ON analytics_reports;
CREATE POLICY analytics_reports_select ON analytics_reports
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS analytics_reports_insert ON analytics_reports;
CREATE POLICY analytics_reports_insert ON analytics_reports
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS analytics_reports_update ON analytics_reports;
CREATE POLICY analytics_reports_update ON analytics_reports
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS analytics_reports_delete ON analytics_reports;
CREATE POLICY analytics_reports_delete ON analytics_reports
  FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
    OR created_by = auth.uid()
  );

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON webhook_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON performance_metrics TO authenticated;
GRANT SELECT, INSERT ON webhook_events TO authenticated;
GRANT SELECT ON webhook_delivery_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analytics_reports TO authenticated;
GRANT SELECT ON performance_alerts TO authenticated;
-- Restrict performance_summary (materialized view) to service role only
REVOKE ALL ON performance_summary FROM authenticated;
REVOKE ALL ON performance_summary FROM anon;
GRANT SELECT ON performance_summary TO service_role;

-- ============================================================================
-- Cleanup/Retention Policies (Optional)
-- ============================================================================

-- Archive old performance metrics (keep 90 days)
-- Run via cron job or trigger
CREATE OR REPLACE FUNCTION archive_old_performance_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Archive old webhook delivery logs (keep 30 days)
CREATE OR REPLACE FUNCTION archive_old_webhook_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_delivery_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SET search_path = public;
