-- Migration: Fix tontines.creator_id foreign key to reference public users
-- Drops FK to auth.users and points to public.users(id)

BEGIN;

-- Drop existing foreign key constraint if it exists
ALTER TABLE tontines
  DROP CONSTRAINT IF EXISTS tontines_creator_id_fkey;

-- Add new foreign key referencing public.users(id)
ALTER TABLE tontines
  ADD CONSTRAINT tontines_creator_id_fkey
  FOREIGN KEY (creator_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

COMMIT;
