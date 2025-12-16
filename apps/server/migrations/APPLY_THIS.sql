-- COMBINED MIGRATION FILE FOR SUPABASE SQL EDITOR
-- Apply this in one go via Supabase Dashboard -> SQL Editor

-- Migration 0009: Create Tontine (ROSCA) tables
BEGIN;

-- Enum for tontine status
DO $$ BEGIN
  CREATE TYPE tontine_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum for member status in tontine
DO $$ BEGIN
  CREATE TYPE tontine_member_status AS ENUM ('ACTIVE', 'SUSPENDED', 'WITHDREW', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum for distribution method
DO $$ BEGIN
  CREATE TYPE distribution_method AS ENUM ('MANUAL_ORDER', 'RANDOM', 'SENIORITY', 'LOTTERY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum for cycle status
DO $$ BEGIN
  CREATE TYPE cycle_status AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Main tontines table (temporarily with placeholder FK)
CREATE TABLE IF NOT EXISTS tontines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL, -- FK added later
  name varchar(255) NOT NULL,
  description text,
  
  -- Financial configuration
  contribution_amount decimal(12, 2) NOT NULL,
  currency varchar(3) DEFAULT 'EUR',
  frequency varchar(32) NOT NULL,
  
  -- Cycle configuration
  total_cycles int NOT NULL,
  cycle_duration_days int NOT NULL,
  
  -- Distribution
  distribution_method distribution_method DEFAULT 'SENIORITY',
  distribution_order int[],
  
  -- Status
  status tontine_status DEFAULT 'ACTIVE',
  current_cycle int DEFAULT 0,
  
  -- Rules & penalties
  late_payment_penalty_percent decimal(5, 2) DEFAULT 0,
  withdrawal_allowed boolean DEFAULT false,
  withdrawal_penalty_percent decimal(5, 2) DEFAULT 10,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Members of a tontine
CREATE TABLE IF NOT EXISTS tontine_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Membership info
  status tontine_member_status DEFAULT 'ACTIVE',
  joined_at timestamp with time zone DEFAULT now(),
  left_at timestamp with time zone,
  
  -- Distribution info
  distribution_order int,
  distribution_date timestamp with time zone,
  has_received_distribution boolean DEFAULT false,
  
  -- Contribution tracking
  total_contributed decimal(12, 2) DEFAULT 0,
  total_expected decimal(12, 2) DEFAULT 0,
  
  -- Contact & permissions
  phone_number varchar(20),
  email_notification boolean DEFAULT true,
  sms_notification boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(tontine_id, user_id)
);

-- Cycles (distribution periods)
CREATE TABLE IF NOT EXISTS tontine_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  cycle_number int NOT NULL,
  
  -- Timeline
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  distribution_date timestamp with time zone,
  
  -- Distribution info
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount decimal(12, 2) DEFAULT 0,
  status cycle_status DEFAULT 'PENDING',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(tontine_id, cycle_number)
);

-- Contributions (payment records)
CREATE TABLE IF NOT EXISTS tontine_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES tontine_members(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES tontine_cycles(id) ON DELETE CASCADE,
  
  -- Amount
  amount decimal(12, 2) NOT NULL,
  currency varchar(3) DEFAULT 'EUR',
  
  -- Status
  status varchar(32) DEFAULT 'PENDING',
  paid_at timestamp with time zone,
  
  -- Payment method
  payment_method varchar(32),
  payment_reference varchar(255),
  
  -- Penalties
  is_late boolean DEFAULT false,
  late_payment_penalty decimal(12, 2) DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(cycle_id, member_id)
);

-- Distributions (payout records)
CREATE TABLE IF NOT EXISTS tontine_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES tontine_cycles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Amount
  total_amount decimal(12, 2) NOT NULL,
  currency varchar(3) DEFAULT 'EUR',
  
  -- Breakdown
  member_count int NOT NULL,
  contributions_collected decimal(12, 2) NOT NULL,
  penalties_collected decimal(12, 2) DEFAULT 0,
  
  -- Status
  status varchar(32) DEFAULT 'PENDING',
  processed_at timestamp with time zone,
  
  -- Payment method
  payout_method varchar(32),
  payout_reference varchar(255),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Audit log for tontine transactions
CREATE TABLE IF NOT EXISTS tontine_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id uuid REFERENCES tontines(id) ON DELETE CASCADE,
  action varchar(128) NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  resource_type varchar(64),
  resource_id uuid,
  
  changes jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tontines_creator_id ON tontines(creator_id);
CREATE INDEX IF NOT EXISTS idx_tontines_status ON tontines(status);
CREATE INDEX IF NOT EXISTS idx_tontine_members_tontine_id ON tontine_members(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_members_user_id ON tontine_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tontine_members_status ON tontine_members(status);
CREATE INDEX IF NOT EXISTS idx_tontine_cycles_tontine_id ON tontine_cycles(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_cycles_status ON tontine_cycles(status);
CREATE INDEX IF NOT EXISTS idx_tontine_contributions_tontine_id ON tontine_contributions(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_contributions_member_id ON tontine_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_tontine_contributions_status ON tontine_contributions(status);
CREATE INDEX IF NOT EXISTS idx_tontine_distributions_tontine_id ON tontine_distributions(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_distributions_recipient_id ON tontine_distributions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_tontine_audit_logs_tontine_id ON tontine_audit_logs(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_audit_logs_actor_id ON tontine_audit_logs(actor_id);

-- Enable RLS
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "tontines_select" ON tontines;
CREATE POLICY "tontines_select" ON tontines
  FOR SELECT USING (
    creator_id = auth.uid() 
    OR id IN (
      SELECT tontine_id FROM tontine_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tontines_insert" ON tontines;
CREATE POLICY "tontines_insert" ON tontines
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "tontines_update" ON tontines;
CREATE POLICY "tontines_update" ON tontines
  FOR UPDATE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "tontine_members_select" ON tontine_members;
CREATE POLICY "tontine_members_select" ON tontine_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR tontine_id IN (
      SELECT id FROM tontines WHERE creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tontine_members_insert" ON tontine_members;
CREATE POLICY "tontine_members_insert" ON tontine_members
  FOR INSERT WITH CHECK (
    tontine_id IN (
      SELECT id FROM tontines WHERE creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tontine_cycles_select" ON tontine_cycles;
CREATE POLICY "tontine_cycles_select" ON tontine_cycles
  FOR SELECT USING (
    tontine_id IN (
      SELECT id FROM tontines 
      WHERE creator_id = auth.uid()
      OR id IN (
        SELECT tontine_id FROM tontine_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "tontine_contributions_select" ON tontine_contributions;
CREATE POLICY "tontine_contributions_select" ON tontine_contributions
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM tontine_members 
      WHERE user_id = auth.uid()
    )
    OR tontine_id IN (
      SELECT id FROM tontines WHERE creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tontine_distributions_select" ON tontine_distributions;
CREATE POLICY "tontine_distributions_select" ON tontine_distributions
  FOR SELECT USING (
    recipient_id = auth.uid()
    OR tontine_id IN (
      SELECT id FROM tontines WHERE creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tontine_audit_logs_select" ON tontine_audit_logs;
CREATE POLICY "tontine_audit_logs_select" ON tontine_audit_logs
  FOR SELECT USING (
    tontine_id IN (
      SELECT id FROM tontines WHERE creator_id = auth.uid()
    )
  );

COMMIT;

-- Migration 0010: Fix creator_id FK to reference public.users
BEGIN;

-- Drop existing FK if it exists
ALTER TABLE tontines
  DROP CONSTRAINT IF EXISTS tontines_creator_id_fkey;

-- Add new FK referencing public.users(id)
ALTER TABLE tontines
  ADD CONSTRAINT tontines_creator_id_fkey
  FOREIGN KEY (creator_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

COMMIT;
