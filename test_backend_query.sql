-- Test the exact query that analytics.service.ts runs for users
-- This simulates what the backend does
SELECT id, created_at, status
FROM public.users
WHERE created_at >= '2025-01-01T00:00:00.000Z'
  AND created_at <= '2026-01-22T23:59:59.999Z';

-- Also test with your actual data date range
SELECT id, created_at, status
FROM public.users
WHERE created_at >= '2025-10-01T00:00:00.000Z'
  AND created_at <= '2025-12-31T23:59:59.999Z';

-- Check if RLS is blocking even service role
-- This should show you what the service sees
SELECT 
  id, 
  email,
  created_at,
  status,
  role,
  tenant_id
FROM public.users
ORDER BY created_at DESC;
