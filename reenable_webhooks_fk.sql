-- Strategy: add FK as NOT VALID to avoid blocking existing invalid rows.
-- After cleanup, optionally VALIDATE the constraint.

-- Idempotent add: only create the constraint if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhooks_user_id_fkey'
  ) THEN
    ALTER TABLE webhooks
    ADD CONSTRAINT webhooks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
END$$;

-- Optional: once data is clean, validate the constraint (this will fail if any row is invalid)
-- ALTER TABLE webhooks VALIDATE CONSTRAINT webhooks_user_id_fkey;

-- Verify definition
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'webhooks_user_id_fkey';

-- Check validation state (convalidated = true means validated)
SELECT conname, convalidated
FROM pg_constraint
WHERE conname = 'webhooks_user_id_fkey';
