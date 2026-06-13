-- ============================================================
-- SECURITY FIX: Revoke anon/authenticated GraphQL access
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Revoke SELECT from anon on all public tables
REVOKE SELECT ON TABLE
  public.accounts,
  public.analytics_reports,
  public.audit_logs,
  public.backup_codes,
  public.cards,
  public.kyc_documents,
  public.license_history,
  public.licenses,
  public.loan_repayments,
  public.loans,
  public.notification_preferences,
  public.notifications,
  public.otp_codes,
  public.performance_alerts,
  public.performance_metrics,
  public.rate_limits,
  public.tenants,
  public.tontine_applications,
  public.tontine_audit_logs,
  public.tontine_contributions,
  public.tontine_cycles,
  public.tontine_distributions,
  public.tontine_invitations,
  public.tontine_members,
  public.tontines,
  public.transactions,
  public.usage_tracking,
  public.user_sessions,
  public.users,
  public.webhook_deliveries,
  public.webhook_delivery_logs,
  public.webhook_events,
  public.webhooks
FROM anon;

REVOKE SELECT ON TABLE public.users_safe FROM anon;

-- 2. Revoke SELECT from authenticated on all public tables
-- (access is controlled via RLS policies, not blanket grants)
REVOKE SELECT ON TABLE
  public.accounts,
  public.analytics_reports,
  public.audit_logs,
  public.backup_codes,
  public.cards,
  public.kyc_documents,
  public.license_history,
  public.licenses,
  public.loan_repayments,
  public.loans,
  public.notification_preferences,
  public.notifications,
  public.otp_codes,
  public.performance_alerts,
  public.performance_metrics,
  public.rate_limits,
  public.tenants,
  public.tontine_applications,
  public.tontine_audit_logs,
  public.tontine_contributions,
  public.tontine_cycles,
  public.tontine_distributions,
  public.tontine_invitations,
  public.tontine_members,
  public.tontines,
  public.transactions,
  public.usage_tracking,
  public.user_sessions,
  public.users,
  public.webhook_deliveries,
  public.webhook_delivery_logs,
  public.webhook_events,
  public.webhooks
FROM authenticated;

REVOKE SELECT ON TABLE public.users_safe FROM authenticated;

-- 3. Add column preferences if not exists
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT NULL;

-- ============================================================
-- NOTE: Leaked password protection must be enabled manually
-- in Supabase Dashboard → Authentication → Password Security
-- → Enable "HaveIBeenPwned" protection
-- ============================================================
