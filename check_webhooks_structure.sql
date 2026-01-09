-- Check the actual structure of the webhooks table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'webhooks'
ORDER BY ordinal_position;
