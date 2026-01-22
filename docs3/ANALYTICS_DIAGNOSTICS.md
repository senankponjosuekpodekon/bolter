# Analytics Issues - Diagnostic & Solutions

Date: 22 Janvier 2026  
Status: 🔧 TROUBLESHOOTING

## Issues Identified

### Issue 1: RLS Infinite Recursion ❌
**Error:** `infinite recursion detected in policy for relation "users"`  
**Cause:** RLS policies on `users` table have circular references  
**Solution:** See [FIX_RLS_INFINITE_RECURSION.md](FIX_RLS_INFINITE_RECURSION.md)

### Issue 2: Zero Records Returned ❌
**Symptom:** All reports return 0 records  
**Cause:** Likely related to RLS blocking queries  
**Solution:** Fix RLS policies first

### Issue 3: Logger Formatting ✅ FIXED
**Issue:** Logs showing "undefined" values  
**Fix:** Updated logger to handle data properly  
**Status:** RESOLVED

---

## Quick Diagnostic Checklist

### 1. Check RLS Status
```sql
-- Run in Supabase SQL Editor
SELECT tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('users', 'transactions', 'kyc_documents', 'loans', 'accounts')
ORDER BY tablename, policyname;
```

**Expected Output:**
- `users`: 4-5 policies (SELECT, INSERT, UPDATE)
- `transactions`: 1-2 policies (SELECT)
- `kyc_documents`: 1-2 policies (SELECT)
- `loans`: 1-2 policies (SELECT)
- `accounts`: 1-2 policies (SELECT)

### 2. Test Direct Query
```sql
-- Test without RLS (as admin/service role)
SELECT COUNT(*) as total_records FROM public.users;
SELECT COUNT(*) as total_records FROM public.transactions;

-- Result should be > 0 for each
```

### 3. Test as Authenticated User
```sql
-- Set user (replace with actual user ID)
SET request.jwt.claims = '{"sub":"user-id-here"}';

-- Try querying
SELECT id, email FROM public.users LIMIT 1;

-- Should either return 1 row (own record) or permission denied
```

---

## Step-by-Step Troubleshooting

### Step 1: Verify Database Connection ✅

**In Browser Console:**
```javascript
// Should not show network errors
// Look for: "XHR finished loading: POST ..." instead of "XHR failed loading"
```

**Expected:** Blue/gray network logs, not red errors

---

### Step 2: Fix RLS Policies 🔧 PRIORITY

**Action:** Follow [FIX_RLS_INFINITE_RECURSION.md](FIX_RLS_INFINITE_RECURSION.md)

**Quick Command:**
```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Create simple non-recursive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all" ON public.users FOR SELECT USING (role IN ('ADMIN', 'COMPLIANCE'));
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
```

---

### Step 3: Verify RLS Fix

**In Browser Console:**
```javascript
// Open Developer Tools → Console
// Click "Generate Report" → Users
// Should see:
// ✅ [Analytics] Generating report: type=users
// ✅ [Analytics] Report generated: id=rpt_... records=X
// ✗ 500 error should not appear
```

---

### Step 4: Test Each Report Type

After RLS fix:

| Type | Expected | Status |
|------|----------|--------|
| Transactions | 0+ records | ? |
| Users | 0+ records | ? |
| KYC | 0+ records | ? |
| Loans | 0+ records | ? |
| Accounts | 0+ records | ? |

---

## Error Messages & Solutions

### Error: "infinite recursion detected in policy"
```
🔧 Solution:
1. Go to Supabase SQL Editor
2. Run: DROP POLICY IF EXISTS "..." ON public.users;
3. Create simple policies (see FIX_RLS_INFINITE_RECURSION.md)
4. Refresh browser
```

### Error: "permission denied for schema public"
```
🔧 Solution:
1. Check user role in auth system
2. Verify RLS policies exist
3. Check user has proper JWT token
4. Try as admin user
```

### Error: "Failed to fetch users: ..."
```
🔧 Solution:
1. Check RLS policies for infinite recursion
2. Verify users table exists and has data
3. Check auth.uid() matches user ID
4. Review database logs for details
```

### All reports returning 0 records
```
🔧 Solution:
1. Check date range (ensure data exists in that period)
2. Verify RLS not filtering all data
3. Check aggregation function
4. Run SELECT COUNT(*) directly in SQL Editor
```

---

## Browser Console Expected Output

### ✅ Good Output:
```
[Analytics] Generating report: type=transactions
[Analytics] Report generated: id=rpt_1704820000000_abc123, records=42
```

### ❌ Bad Output:
```
[Analytics] Generating report: type=users undefined
[Analytics Warning] Report generation failed: SERVER_ERROR
Failed to fetch users: infinite recursion detected...
```

---

## Recovery Procedure

If all reports fail:

### Option 1: Disable RLS Temporarily
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
```

**Test:** Do reports work now?
- ✅ YES → Problem is RLS policies (go to Step 2)
- ❌ NO → Problem is elsewhere (check database)

### Option 2: Enable RLS with Permissive Policies
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (temporary)
CREATE POLICY "Temp allow all" ON public.users 
FOR SELECT USING (true);
```

---

## Monitoring & Validation

### After Fix Applied:

```javascript
// In browser console - run these checks:

// Check 1: Transactions work?
console.log('Testing transactions...');
// Click generate on transactions → should succeed

// Check 2: Users work?
console.log('Testing users...');
// Click generate on users → should succeed

// Check 3: All others work?
// Repeat for kyc, loans, accounts
```

### Server Logs

```bash
# SSH into server and check logs
docker logs bolter-api | grep -i "infinite recursion"
docker logs bolter-api | grep -i "permission denied"
docker logs bolter-api | grep -i "SELECT.*users"
```

---

## Files to Review

1. 📄 [FIX_RLS_INFINITE_RECURSION.md](FIX_RLS_INFINITE_RECURSION.md) - RLS fix guide
2. 📄 [ANALYTICS_ERROR_HANDLING.md](ANALYTICS_ERROR_HANDLING.md) - Error codes
3. 📄 [USERS_RLS_SECURITY_FIX_GUIDE.md](USERS_RLS_SECURITY_FIX_GUIDE.md) - Previous RLS guide

---

## Contact Support

If issues persist after following this guide:

1. ✅ Check RLS policies in Supabase dashboard
2. ✅ Verify auth token is valid
3. ✅ Check date ranges have data
4. ✅ Review browser console for exact error
5. ✅ Share the error message + screenshot

---

## Summary

| Issue | Fix | Status |
|-------|-----|--------|
| Infinite recursion on users | Drop recursive policies | 🔧 PENDING |
| Zero records returned | Fix RLS + verify data | 🔧 PENDING |
| Undefined logs | Improved logger | ✅ DONE |
| 500 errors | Better error handling | ✅ DONE |

**Next Step:** Follow [FIX_RLS_INFINITE_RECURSION.md](FIX_RLS_INFINITE_RECURSION.md) to resolve the primary issue.
