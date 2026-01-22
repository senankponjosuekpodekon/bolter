# Fix RLS Infinite Recursion Error

**Error:** `infinite recursion detected in policy for relation "users"`

## Problem

The `users` table has RLS (Row Level Security) policies that reference the `users` table itself, causing infinite recursion.

## Root Cause

RLS policies on `users` table are trying to query the `users` table within the policy evaluation, creating a loop:

```sql
-- ❌ BAD - Causes infinite recursion
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );
```

## Solution

Remove recursive policies and use simple non-recursive checks:

```sql
-- ✅ GOOD - No recursion
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (role IN ('ADMIN', 'COMPLIANCE'));
```

## Implementation Steps

### Step 1: Drop Existing Problematic Policies

```sql
-- Connect to your Supabase database
-- Go to SQL Editor and run:

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Add any other policies you may have created
```

### Step 2: Create Simple Non-Recursive Policies

```sql
-- Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view themselves
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Admins and compliance can view all users
CREATE POLICY "Admins and compliance can view all users" ON public.users
  FOR SELECT
  USING (role IN ('ADMIN', 'COMPLIANCE'));

-- Policy 3: Users can update themselves
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can insert themselves (registration)
CREATE POLICY "Users can insert own record" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 5: Users cannot delete themselves
CREATE POLICY "No deletion of user records" ON public.users
  FOR DELETE
  USING (false);
```

### Step 3: Verify Policies

```sql
-- Check policies are created correctly
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

### Step 4: Test Access

```sql
-- Test as authenticated user
SELECT id, email, first_name FROM public.users LIMIT 1;

-- Should see only own user record if not admin
-- Should see all if admin/compliance role
```

## Alternative: Use a Safe View Instead

If you want to avoid RLS complexity, use a view instead:

```sql
-- Create safe view without sensitive columns
CREATE VIEW public.users_safe WITH (security_invoker) AS
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  phone, 
  address, 
  tenant_id, 
  role, 
  status, 
  kyc_status, 
  locale, 
  currency, 
  timezone,
  created_at, 
  updated_at 
FROM public.users;

-- Simpler RLS on view instead of table
ALTER TABLE public.users_safe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View safe user data" ON public.users_safe
  FOR SELECT
  USING (true); -- Allow all authenticated users
```

## Testing

After applying the fix:

### Test 1: Transactions Report (Should work)
```
Type: transactions
Date: Last 30 days
Expected: Returns transaction data
```

### Test 2: Users Report (Was failing)
```
Type: users
Date: Last 30 days
Expected: Returns user statistics (not all users, just counts)
```

### Test 3: KYC Report (Should work)
```
Type: kyc
Date: Last 30 days
Expected: Returns KYC document statistics
```

## Monitoring

After fix, monitor the console for:
- ✅ Reports generate without errors
- ✅ Correct number of records returned
- ✅ No "infinite recursion" errors
- ✅ No permission denied errors

## Rollback (if needed)

```sql
-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins and compliance can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "No deletion of user records" ON public.users;

-- Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

## Key Points

1. ✅ Never use subqueries on the same table in RLS policies
2. ✅ Keep policies simple: direct ID checks only
3. ✅ Admin/role checks are OK (no recursion if checking columns directly)
4. ✅ Use views for complex filtering if needed
5. ✅ Test each policy independently

---

## Quick Fix Command

Copy this entire script and run in Supabase SQL Editor:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (role IN ('ADMIN', 'COMPLIANCE'));

CREATE POLICY "Users can update themselves" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can register" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify
SELECT policyname, qual FROM pg_policies WHERE tablename = 'users';
```

After running this, refresh your browser and try the analytics reports again!
