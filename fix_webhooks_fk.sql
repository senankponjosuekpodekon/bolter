-- Fix webhooks foreign key constraint
-- This changes the foreign key from pointing to a custom users table
-- to pointing to Supabase's built-in auth.users table

-- Drop the existing foreign key constraint
ALTER TABLE webhooks DROP CONSTRAINT IF EXISTS webhooks_user_id_fkey;

-- Add new foreign key pointing to auth.users
ALTER TABLE webhooks
ADD CONSTRAINT webhooks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the change
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'webhooks' AND tc.constraint_type = 'FOREIGN KEY';
