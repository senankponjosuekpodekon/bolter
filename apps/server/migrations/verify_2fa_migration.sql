-- Verification script for 2FA migration
-- Run this to check if 2FA columns exist

DO $$ 
DECLARE
    column_exists INTEGER;
BEGIN
    -- Check if two_factor_secret exists
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns 
    WHERE table_name='users' 
    AND column_name='two_factor_secret';
    
    IF column_exists = 0 THEN
        RAISE NOTICE 'Column two_factor_secret does NOT exist. Running migration...';
        
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS two_factor_secret text DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS temp_two_factor_secret text DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT FALSE;
          
        RAISE NOTICE 'Migration completed successfully!';
    ELSE
        RAISE NOTICE 'Column two_factor_secret already exists. Migration not needed.';
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('two_factor_secret', 'temp_two_factor_secret', 'two_factor_enabled')
ORDER BY column_name;
