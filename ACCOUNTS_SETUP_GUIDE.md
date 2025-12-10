# Accounts Module - Setup Guide

## Problem

The frontend was trying to create accounts with `currency` and `limit` properties, but the Supabase `accounts` table didn't have these columns defined, causing validation errors.

## Solution

Two steps are required:

### Step 1: Add Missing Columns to Supabase

Execute the SQL migration in your Supabase console (https://app.supabase.com > SQL Editor):

```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "limit" DECIMAL(10, 2) DEFAULT 1000;

CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE INDEX IF NOT EXISTS idx_accounts_limit ON accounts("limit");
```

**Or use the migration file:**

```bash
cat SUPABASE_MIGRATION_ACCOUNTS.sql | sqlite3 your_db.db
```

### Step 2: Backend Updates

The DTOs have been updated to accept and validate:

- `currency`: EUR, USD, or GBP (default: EUR)
- `limit`: 100 to 100,000 (default: 1000)

**Files modified:**

- `apps/server/src/accounts/dto/create-account.dto.ts` - Added currency & limit validation
- `apps/server/src/accounts/dto/update-account.dto.ts` - Added currency & limit fields
- `apps/server/src/accounts/accounts.service.ts` - Updated Account interface and create/update methods

### Step 3: Frontend

No changes needed - the Accounts.tsx page already sends these fields correctly.

## Testing

After adding the columns to Supabase:

1. Open the **Accounts** page
2. Fill in the form:
   - Account Type: CHECKING or SAVINGS
   - Currency: EUR, USD, or GBP
   - Limit: 100 to 10,000
3. Click "Create Account"

The account should now be created with the specified currency and limit.

## Features

✅ Create accounts in multiple currencies (EUR, USD, GBP)
✅ Set custom spending limits per account (100 - 100,000)
✅ Defaults: EUR currency, 1000 limit
✅ Audit logs track currency and limit changes
✅ Notifications on account creation
