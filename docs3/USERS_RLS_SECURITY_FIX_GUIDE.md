# Supabase Security Linter Issues - Users Table RLS Fix

## Executive Summary

Your Supabase database has **3 critical security issues** on the `public.users` table:

1. **RLS Policies Exist But RLS Not Enabled** - Policies defined but not enforced
2. **RLS Disabled in Public Schema** - Public table without row-level security
3. **Sensitive Columns Exposed** - `refresh_token` accessible without protection

**Status**: All issues can be fixed by enabling RLS and reviewing column access.

---

## Issue Details

### Issue #1: policy_exists_rls_disabled

**Severity**: 🔴 ERROR  
**Category**: SECURITY

**Problem**:
```
Table `public.users` has RLS policies but RLS is not enabled on the table.
Policies include:
  - "Users and Admins can view users (OPTIMIZED)"
  - "Users can update own profile (OPTIMIZED)"
  - "users_tenant_isolation"
```

**Why It's Critical**:
- Policies are defined but **NOT ENFORCED** because RLS is disabled
- Anyone with database access can bypass all policies
- Administrative intent exists but security isn't active

**Impact**: 
- All user data is readable by any authenticated Supabase user
- No row-level filtering is applied
- Sensitive data like `refresh_token` is exposed

---

### Issue #2: rls_disabled_in_public

**Severity**: 🔴 ERROR  
**Category**: SECURITY

**Problem**:
```
Table `public.users` is public, but RLS has not been enabled.
```

**Why It's Critical**:
- The `public` schema tables are exposed via PostgREST API
- Without RLS, all rows are accessible to any authenticated user
- Violates Zero Trust security principles

**Impact**:
- API calls to `/rest/v1/users` return all users
- No tenant isolation
- No role-based access control

---

### Issue #3: sensitive_columns_exposed

**Severity**: 🔴 ERROR  
**Category**: SECURITY

**Problem**:
```
Table `public.users` is exposed via API without RLS and contains 
potentially sensitive column(s): refresh_token

This may lead to data exposure.
```

**Why It's Critical**:
- `refresh_token` is used for long-lived authentication
- Exposed tokens could allow account takeover
- PII and authentication credentials exposed

**Impact**:
- Attackers can extract JWT refresh tokens
- Account hijacking possible
- Compliance violations (GDPR, SOC 2)

---

## Root Cause Analysis

Looking at your migrations, RLS was **intended** to be enabled:

From `001_create_tenants_and_licenses.sql`:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

However, based on the linter report, **RLS is currently disabled**. This could happen if:

1. Migration was never executed against your Supabase project
2. RLS was explicitly disabled with `ALTER TABLE users DISABLE ROW LEVEL SECURITY`
3. Table was recreated without RLS enabled
4. Supabase backup/restore didn't preserve RLS state

---

## Solution: Fix Users Table RLS

### Step 1: Enable RLS

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

**What this does**:
- Activates all existing RLS policies
- Enforces row filtering on all queries
- Returns 403 if no policy allows access

### Step 2: Apply Standard Policies

Your code already defines these policies. Ensure they're in place:

**Policy 1: Users view own profile**
```sql
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

**Policy 2: Users view tenant members**
```sql
CREATE POLICY "Users and Admins can view users (OPTIMIZED)"
  ON public.users
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1)
    OR role = 'admin'
  );
```

**Policy 3: Users update own profile**
```sql
CREATE POLICY "Users can update own profile (OPTIMIZED)"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Step 3: Protect Sensitive Columns

#### Option A: Column-Level Access Control (v13+)

```sql
-- Deny public access to sensitive columns
REVOKE SELECT (refresh_token, password_hash) ON public.users FROM anon, authenticated;
```

#### Option B: Safe User View (Recommended for APIs)

```sql
CREATE VIEW public.users_safe AS
SELECT 
  id, email, display_name, avatar_url, phone_number,
  tenant_id, role, kyc_status, created_at, updated_at
FROM public.users;
```

Use this view in your API instead of direct table access.

---

## Implementation Plan

### Phase 1: Immediate (Next Deploy)

1. **Run the fix script** in Supabase SQL Editor:
   ```
   Location: /FIX_USERS_RLS_SECURITY.sql
   ```

2. **Verify in Supabase Dashboard**:
   - Go to: Authentication → Policies
   - Check that `public.users` shows RLS is ENABLED
   - Verify all 4 policies are listed

3. **Test access** with Supabase client:
   ```typescript
   // Should return only current user
   const { data } = await supabase
     .from('users')
     .select('*');
   
   // Should return team members
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('tenant_id', userTenantId);
   ```

### Phase 2: Code Updates (Immediate)

Update any API endpoints that query users directly:

```typescript
// BEFORE: Bypasses RLS (dangerous)
const users = await adminClient
  .from('users')
  .select('*'); // All columns exposed

// AFTER: Use safe view
const users = await supabase
  .from('users_safe')  // Only safe columns
  .select('*');

// OR: Use adminClient with explicit column selection
const users = await adminClient
  .from('users')
  .select('id, email, display_name, tenant_id, role');  // No refresh_token
```

### Phase 3: Testing (Before Production)

```bash
# Test script: Verify RLS enforcement
# 1. Create two test users in different tenants
# 2. Verify User A cannot see User B's data
# 3. Verify User A cannot see refresh_token column
# 4. Verify admin can see all users
```

---

## Verification Checklist

After applying the fix, verify:

- [ ] RLS is ENABLED on `public.users` table
  ```sql
  SELECT rowsecurity FROM pg_tables 
  WHERE tablename='users' AND schemaname='public';
  -- Should return: t (true)
  ```

- [ ] All 4 policies exist
  ```sql
  SELECT COUNT(*) FROM pg_policies 
  WHERE tablename='users' AND schemaname='public';
  -- Should return: 4
  ```

- [ ] Sensitive columns are protected
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name='users' AND column_name IN ('refresh_token', 'password_hash');
  ```

- [ ] Test as authenticated user
  ```typescript
  // Should fail or return empty if user doesn't have access
  const { data, error } = await supabase
    .from('users')
    .select('id, refresh_token');
  ```

- [ ] Test as admin
  ```typescript
  // Admins can see via adminClient bypass
  const { data } = await adminClient
    .from('users')
    .select('id, refresh_token');
  ```

---

## Impact on Application

### For Frontend Users
- ✅ No changes needed
- RLS transparent to authenticated users
- User can still access their own profile
- Can see team members in same tenant

### For Backend Services
- ⚠️ Review all user queries
- Cannot use `.select('*')` - must list safe columns
- Use `adminClient` only for admin operations
- Use `supabase` (authenticated) for normal queries

### For Admin Dashboard
- ✅ Works as-is if using adminClient
- Will see all users with RLS bypass
- Add logging for security audit trail

### Compliance Impact
- ✅ GDPR: PII now protected from exposure
- ✅ SOC 2: Row-level security implemented
- ✅ Security Best Practice: Defense-in-depth achieved

---

## Prevention: Future Security

To prevent similar issues:

1. **Enable RLS by default in migrations**
   ```sql
   CREATE TABLE users (...);
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   CREATE POLICY ... ON users ...;
   ```

2. **Use `.select()` explicitly** - never use `.select('*')`
   ```typescript
   // Bad
   .select('*')
   
   // Good
   .select('id, email, display_name, tenant_id, role')
   ```

3. **Create safe views** for API exposure
   ```sql
   CREATE VIEW public.users_safe AS ...;
   ```

4. **Run linter regularly**
   - Supabase Dashboard → Reports → Security Linter
   - Fix issues before production deployment

5. **Test RLS policies** in your test suite
   ```typescript
   test('User cannot see other users refresh_token', async () => {
     const { error } = await userClient
       .from('users')
       .select('refresh_token')
       .eq('id', otherUserId);
     
     expect(error).toBeDefined(); // Should fail
   });
   ```

---

## Remediation References

- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Linter: Policy Exists RLS Disabled](https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled)
- [Linter: RLS Disabled in Public](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- [Linter: Sensitive Columns Exposed](https://supabase.com/docs/guides/database/database-linter?lint=0023_sensitive_columns_exposed)

---

## Questions & Troubleshooting

**Q: Will enabling RLS break my app?**  
A: Only if your app has logic that depends on seeing other users' data without checking permissions. Fix those queries to be explicit about column selection.

**Q: How do admins see all users?**  
A: Use `adminClient` which bypasses RLS, or add an admin policy like:
```sql
CREATE POLICY "Admins can see all users" ON public.users
  FOR SELECT USING (role = 'admin');
```

**Q: Can I test RLS locally?**  
A: Yes, with Supabase local development:
```bash
supabase start
# RLS is enabled by default in local setup
```

**Q: What if I get "permission denied" errors?**  
A: Add a policy that matches your use case, or explicitly select safe columns only.

---

## Implementation Files

- **SQL Fix**: `/FIX_USERS_RLS_SECURITY.sql` - Run this in Supabase SQL Editor
- **Reference**: `/apps/server/migrations/001_create_tenants_and_licenses.sql` - Existing policies
- **This Guide**: `/USERS_RLS_SECURITY_FIX_GUIDE.md`

---

**Created**: 2026-01-22  
**Status**: Ready for Implementation  
**Priority**: CRITICAL
