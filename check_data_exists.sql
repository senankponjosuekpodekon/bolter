-- Check if tables have data
SELECT 'users' AS table_name, COUNT(*) AS total_records FROM public.users
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'kyc_documents', COUNT(*) FROM public.kyc_documents
UNION ALL
SELECT 'loans', COUNT(*) FROM public.loans
UNION ALL
SELECT 'accounts', COUNT(*) FROM public.accounts;

-- Check date ranges for each table
SELECT 'users' AS table_name, 
       MIN(created_at) AS earliest_date, 
       MAX(created_at) AS latest_date,
       COUNT(*) AS total
FROM public.users
UNION ALL
SELECT 'transactions',
       MIN(created_at),
       MAX(created_at),
       COUNT(*)
FROM public.transactions
UNION ALL
SELECT 'kyc_documents',
       MIN(created_at),
       MAX(created_at),
       COUNT(*)
FROM public.kyc_documents
UNION ALL
SELECT 'loans',
       MIN(created_at),
       MAX(created_at),
       COUNT(*)
FROM public.loans
UNION ALL
SELECT 'accounts',
       MIN(created_at),
       MAX(created_at),
       COUNT(*)
FROM public.accounts;
