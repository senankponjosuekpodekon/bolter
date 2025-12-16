-- Migration: Fix remaining tontine user foreign keys to reference public.users
-- Ensures all user references point to the application users table

BEGIN;

-- tontine_members.user_id -> public.users
ALTER TABLE tontine_members
  DROP CONSTRAINT IF EXISTS tontine_members_user_id_fkey,
  ADD CONSTRAINT tontine_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- tontine_cycles.recipient_id -> public.users
ALTER TABLE tontine_cycles
  DROP CONSTRAINT IF EXISTS tontine_cycles_recipient_id_fkey,
  ADD CONSTRAINT tontine_cycles_recipient_id_fkey
  FOREIGN KEY (recipient_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- tontine_distributions.recipient_id -> public.users
ALTER TABLE tontine_distributions
  DROP CONSTRAINT IF EXISTS tontine_distributions_recipient_id_fkey,
  ADD CONSTRAINT tontine_distributions_recipient_id_fkey
  FOREIGN KEY (recipient_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

COMMIT;
