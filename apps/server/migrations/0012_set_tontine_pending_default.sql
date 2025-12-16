-- Migration: add PENDING status for tontines and set it as default
-- Purpose: new tontines should start inactive and be explicitly started

-- IMPORTANT: Adding a new enum value must be committed
-- before using that value in defaults or updates.

BEGIN;
  -- Add the PENDING value to the enum if it does not exist
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'tontine_status' AND e.enumlabel = 'PENDING'
    ) THEN
      ALTER TYPE tontine_status ADD VALUE 'PENDING';
    END IF;
  END$$;
COMMIT;

-- Now that the new enum label exists and is committed, we can use it.
BEGIN;
  -- Set default to PENDING for new rows
  ALTER TABLE tontines ALTER COLUMN status SET DEFAULT 'PENDING';

  -- Backfill: mark as PENDING any tontine that is still at cycle 0 and never started
  UPDATE tontines
  SET status = 'PENDING'
  WHERE status = 'ACTIVE'
    AND (started_at IS NULL OR current_cycle = 0);
COMMIT;
