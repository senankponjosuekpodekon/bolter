-- Identify rows in public.webhooks whose user_id doesn't exist in auth.users
SELECT w.id, w.user_id, w.created_at
FROM webhooks AS w
LEFT JOIN auth.users AS u ON w.user_id = u.id
WHERE u.id IS NULL
ORDER BY w.created_at DESC;

-- Option A: Delete invalid rows (irreversible). Run after reviewing the SELECT results.
-- DELETE FROM webhooks
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Option B: Fix rows by reassigning to a valid user (provide a real UUID below).
-- UPDATE webhooks
-- SET user_id = 'REPLACE_WITH_VALID_AUTH_USER_UUID'
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- After cleanup, you can validate the FK:
-- ALTER TABLE webhooks VALIDATE CONSTRAINT webhooks_user_id_fkey;