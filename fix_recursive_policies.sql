-- ❌ REMOVE THE RECURSIVE POLICIES
DROP POLICY IF EXISTS "Users and Admins can view users (OPTIMIZED)" ON public.users;
DROP POLICY IF EXISTS "users_tenant_isolation" ON public.users;

-- Also clean up duplicate policies (keep only the simplest ones)
DROP POLICY IF EXISTS "Admins and compliance can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile (OPTIMIZED)" ON public.users;
DROP POLICY IF EXISTS "Users insert" ON public.users;
DROP POLICY IF EXISTS "Users update own" ON public.users;
DROP POLICY IF EXISTS "Users view own" ON public.users;

-- ✅ RESULT: Only 5 simple non-recursive policies will remain:
-- 1. "Admins view all" - (role = ANY (ARRAY['ADMIN'::user_role, 'COMPLIANCE'::user_role]))
-- 2. "No deletion of user records" - false
-- 3. "Users can insert own record" - (auth.uid() = id)
-- 4. "Users can update own profile" - (auth.uid() = id)
-- 5. "Users can view own profile" - (auth.uid() = id)
