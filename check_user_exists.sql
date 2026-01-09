-- Check if your user ID exists in auth.users
-- Replace YOUR_USER_ID with the actual UUID from your JWT token
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'beed9b48-a04d-421f-bcb0-878dd5e4eda9';

-- Also check if there's a users table in public schema
SELECT id, email, created_at 
FROM public.users 
WHERE id = 'beed9b48-a04d-421f-bcb0-878dd5e4eda9';
