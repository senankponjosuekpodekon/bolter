#!/bin/bash

# Script to help with Supabase database migration
# This script provides instructions for adding the missing columns to the accounts table

echo "=========================================="
echo "Supabase Accounts Table Migration Helper"
echo "=========================================="
echo ""
echo "The following columns need to be added to your Supabase 'accounts' table:"
echo ""
echo "1. currency (VARCHAR(3)) - Default: 'EUR'"
echo "2. limit (DECIMAL(10, 2)) - Default: 1000"
echo ""
echo "=========================================="
echo "Steps to apply the migration:"
echo "=========================================="
echo ""
echo "1. Go to https://app.supabase.com"
echo "2. Select your project"
echo "3. Go to SQL Editor (left sidebar)"
echo "4. Click 'New Query'"
echo "5. Copy and paste the following SQL:"
echo ""
echo "--- BEGIN SQL ---"
cat << 'EOF'
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "limit" DECIMAL(10, 2) DEFAULT 1000;

CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE INDEX IF NOT EXISTS idx_accounts_limit ON accounts("limit");
EOF
echo "--- END SQL ---"
echo ""
echo "6. Click 'Run' button"
echo "7. You should see: Query successful (2 rows affected)"
echo ""
echo "=========================================="
echo "Verification:"
echo "=========================================="
echo ""
echo "To verify the columns were added:"
echo "1. In SQL Editor, run:"
echo ""
echo "SELECT column_name, data_type FROM information_schema.columns"
echo "WHERE table_name='accounts' ORDER BY ordinal_position;"
echo ""
echo "You should see 'currency' and 'limit' in the output."
echo ""
echo "=========================================="
echo ""
echo "If you encounter any issues, refer to:"
echo "- ACCOUNTS_SETUP_GUIDE.md"
echo "- SUPABASE_MIGRATION_ACCOUNTS.sql"
echo ""
