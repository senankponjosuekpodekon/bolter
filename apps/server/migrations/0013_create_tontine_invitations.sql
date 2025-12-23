-- Migration: Add tontine invitations and applications tables
-- Purpose: secure shareable invite links and application workflow

BEGIN;

-- Invitations: secure shareable codes
CREATE TABLE IF NOT EXISTS tontine_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  code varchar(64) UNIQUE NOT NULL, -- secure random code
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  max_uses int, -- optional limit on number of applications
  use_count int DEFAULT 0
);

-- Applications: users applying to join
CREATE TABLE IF NOT EXISTS tontine_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  invitation_id uuid REFERENCES tontine_invitations(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status varchar(32) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  message text, -- optional message from applicant
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(tontine_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tontine_invitations_tontine ON tontine_invitations(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_invitations_code ON tontine_invitations(code);
CREATE INDEX IF NOT EXISTS idx_tontine_applications_tontine ON tontine_applications(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_applications_user ON tontine_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tontine_applications_status ON tontine_applications(status);

-- RLS policies
ALTER TABLE tontine_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_applications ENABLE ROW LEVEL SECURITY;

-- Invitations: creator can view/manage, anyone can read via code lookup (handled by service)
CREATE POLICY tontine_invitations_creator_all ON tontine_invitations
  FOR ALL USING (created_by = auth.uid());

-- Applications: applicant can view their own applications
-- NOTE: Creator view is handled in service via adminClient to avoid RLS recursion
CREATE POLICY tontine_applications_select ON tontine_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY tontine_applications_insert ON tontine_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

COMMIT;
