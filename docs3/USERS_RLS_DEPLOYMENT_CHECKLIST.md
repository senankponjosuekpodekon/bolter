# Supabase Users RLS Security - Deployment Checklist

## 🔴 CRITICAL SECURITY ISSUES IDENTIFIED

Your production Supabase database has 3 critical security vulnerabilities:

1. **RLS policies defined but NOT ENFORCED** - Policies exist but RLS is disabled
2. **Public table without row-level security** - Users table exposed via API
3. **Sensitive token data exposed** - refresh_token accessible to all authenticated users

**Risk Level**: CRITICAL - Immediate action required  
**Timeline**: Fix before next production deployment  
**Estimated Time**: 15-30 minutes

---

## Pre-Deployment Checklist

### [ ] 1. Review Security Issues

**Read** these documents in order:
- [✓] `USERS_RLS_SECURITY_FIX_GUIDE.md` - Full explanation
- [✓] `FIX_USERS_RLS_SECURITY.sql` - Fix script

**Verify** you understand:
- Why RLS must be enabled
- What each policy does
- Impact on your application

### [ ] 2. Backup Database

Before making any changes:

```bash
# In Supabase Dashboard:
# 1. Go to Database → Backups
# 2. Click "Create a manual backup"
# 3. Wait for backup to complete
# 4. Note the backup ID and timestamp
```

Or via CLI:
```bash
supabase db pull  # Download current schema
git commit -m "Backup: Before RLS fix"
```

### [ ] 3. Review Current State

Run this in Supabase SQL Editor to see current state:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- List current policies
SELECT policyname, permissive, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
```

**Expected Result BEFORE fix**:
- `rowsecurity` = `false` (RLS is disabled)
- Several policies should be listed

### [ ] 4. Test in Non-Production First

If you have a staging database:

```bash
supabase link --project-ref staging-project-id
supabase db push  # Or run SQL in staging
```

Then test your app against staging.

---

## Deployment Steps

### Step 1: Apply Security Fix (5 min)

**Location**: Supabase Dashboard → SQL Editor  
**File**: `/FIX_USERS_RLS_SECURITY.sql`

```bash
# Copy entire script and paste into Supabase SQL Editor
# Then click "Execute"
```

Or via CLI:
```bash
supabase db push --dry-run  # Review changes
supabase db push            # Apply changes
```

**What happens**:
1. RLS is enabled on `public.users` table
2. Existing policies are verified/recreated
3. Sensitive column access is restricted
4. Safe `users_safe` view is created

### Step 2: Verify RLS is Enabled (2 min)

Run in SQL Editor:

```sql
-- Verify RLS is ON
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';
-- Expected: rowsecurity = t (true)
```

### Step 3: Verify Policies (2 min)

```sql
-- List all policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
```

**Expected policies** (should have at least 4):
- [ ] Users and Admins can view users (OPTIMIZED)
- [ ] Users can update own profile (OPTIMIZED)
- [ ] Users can view own profile
- [ ] users_tenant_isolation

### Step 4: Update Backend Code (5 min)

Review all places where users are queried:

**FIND**: Search for patterns
```typescript
// Dangerous - selects all columns
.from('users')
  .select('*')

// Dangerous - includes sensitive columns
.from('users')
  .select('id, email, refresh_token, password_hash')
```

**REPLACE**: Use safe views or explicit columns
```typescript
// Good - uses safe view
.from('users_safe')
  .select('*')

// Good - explicit safe columns only
.from('users')
  .select('id, email, display_name, tenant_id, role, kyc_status')
```

**Files to check**:
- [ ] `apps/server/src/services/user.service.ts`
- [ ] `apps/server/src/controllers/admin.controller.ts`
- [ ] `apps/server/src/modules/**/*.service.ts` (any file using users table)
- [ ] `apps/client/src/services/*.ts` (client services)

### Step 5: Test in Development (10 min)

```bash
# Start local development with RLS
supabase start

# Run your app
npm run dev

# Test scenarios in browser console
```

Test these scenarios:

```javascript
// Test 1: User sees only themselves
const { data } = await supabase
  .from('users')
  .select('id, email');
console.log(data); // Should have only 1 user

// Test 2: User cannot access other users
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 'some-other-user-id');
console.log(error); // Should have permission error

// Test 3: Sensitive columns are inaccessible
const { data, error } = await supabase
  .from('users')
  .select('refresh_token');
console.log(error); // Should have column not found error
```

### Step 6: Deploy to Staging (5 min)

```bash
# 1. Commit code changes
git add .
git commit -m "Security: Fix users table RLS exposure

- Enable RLS on public.users table
- Restrict sensitive column access
- Update queries to use safe columns
- Fixes: policy_exists_rls_disabled, rls_disabled_in_public, sensitive_columns_exposed"

# 2. Push to staging branch
git push origin staging

# 3. Deploy to staging environment
# (Follow your normal CI/CD process)
```

### Step 7: Staging Testing (15 min)

**In Staging Environment**:

```bash
# 1. Verify RLS is enabled
supabase link --project-ref staging-project-id
supabase db pull

# 2. Test user signup flow
# 3. Test viewing user profiles
# 4. Test admin functions
# 5. Monitor error logs
```

**Test Checklist**:
- [ ] Users can login
- [ ] Users can see their own profile
- [ ] Users can see team members
- [ ] Admins can see all users
- [ ] No sensitive data in network requests
- [ ] No "permission denied" errors for normal operations
- [ ] No performance degradation

### Step 8: Deploy to Production (5 min)

```bash
# 1. Create release branch
git checkout -b release/rls-security-fix
git merge staging
git tag -a v1.x.x -m "RLS Security Fix"
git push origin release/rls-security-fix
git push origin v1.x.x

# 2. Deploy to production
# (Follow your normal release process)
```

### Step 9: Monitor Production (30 min post-deploy)

After deployment:

```bash
# 1. Check application logs
# Look for any "permission denied" errors
# Look for any RLS-related errors

# 2. Monitor error tracking
# Sentry / LogRocket / your error service
# Watch for new errors

# 3. Test critical flows
# User login
# Profile access
# Admin dashboard access

# 4. Verify database linter
# Go to Supabase Dashboard
# Reports → Security Linter
# Verify the 3 issues are RESOLVED
```

---

## Rollback Plan

If anything goes wrong:

### Immediate Rollback (5 min)

```sql
-- In Supabase SQL Editor, run:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

This will:
- Disable RLS enforcement
- Policies remain but are ignored
- App returns to previous state
- **Note**: Leaves you exposed - should not be permanent

### Full Rollback (15 min)

```bash
# 1. Go to Supabase Dashboard
# 2. Database → Backups
# 3. Click "Restore" on backup created before fix
# 4. Confirm
# 5. Revert code changes
git revert <commit-hash>
git push origin main
```

---

## Post-Deployment Verification

Run these checks 24 hours after successful deployment:

### [ ] Security Linter - All Green

In Supabase Dashboard → Reports → Security Linter:

```
✓ policy_exists_rls_disabled - RESOLVED
✓ rls_disabled_in_public - RESOLVED  
✓ sensitive_columns_exposed - RESOLVED
```

### [ ] No Error Spikes

Check error tracking:
- [ ] Error rate normal
- [ ] No new "permission denied" errors
- [ ] No RLS-related errors

### [ ] Database Performance

Check Supabase dashboard:
- [ ] Query performance normal
- [ ] No slow queries introduced
- [ ] Connection count normal

### [ ] User Feedback

Monitor support channels:
- [ ] No complaints about access denied
- [ ] Users can complete normal flows
- [ ] Admin functions work

### [ ] Final SQL Verification

```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Should show: rowsecurity = t (true)
```

---

## Communication Template

### For Developers
```
🔒 SECURITY UPDATE: Users Table RLS Fix

We've enabled Row Level Security on the users table to fix critical
security vulnerabilities. This prevents unauthorized data access.

Changes:
- RLS is now ENABLED (policies are enforced)
- refresh_token is no longer exposed via API
- Queries must use explicit column selection

Impact:
- Your app must not use .select('*') on users
- Use users_safe view or select specific columns
- Admin operations still work via adminClient

Deployment: [DATE/TIME]
Rollback: Available via database backup [ID]

Questions? Check: USERS_RLS_SECURITY_FIX_GUIDE.md
```

### For Stakeholders
```
✅ Security Enhancement Deployed

We've implemented critical Row Level Security measures on the users
database table to prevent unauthorized data access. This ensures:

- User data is only visible to authorized users
- Sensitive authentication tokens are protected
- Compliance with security standards (GDPR, SOC 2)

Status: ✅ Deployed to Production
Risk: None - No user-facing changes
Performance: No impact

Next: Supabase will acknowledge security improvements in audit.
```

---

## Reference Documents

- **Full Guide**: `USERS_RLS_SECURITY_FIX_GUIDE.md`
- **SQL Fix**: `FIX_USERS_RLS_SECURITY.sql`
- **Migrations**: `apps/server/migrations/001_create_tenants_and_licenses.sql`

## Support Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Security Linter](https://supabase.com/docs/guides/database/database-linter)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

## Sign-Off

- **Security Review**: [ ] By _______________  Date: _____
- **QA Testing**: [ ] By _______________  Date: _____
- **Manager Approval**: [ ] By _______________  Date: _____
- **Deployment**: [ ] By _______________  Date: _____

---

**Document Version**: 1.0  
**Created**: 2026-01-22  
**Status**: READY FOR DEPLOYMENT  
**Priority**: 🔴 CRITICAL
