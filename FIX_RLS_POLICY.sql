-- Fix infinite recursion in tontine_applications RLS policy
-- Execute this in Supabase SQL Editor: https://app.supabase.com/project/[YOUR_PROJECT]/sql

-- Drop the problematic policy that tries to join with tontines table
DROP POLICY IF EXISTS tontine_applications_select ON tontine_applications;

-- Create simplified policy: only users can see their own applications
-- Creator viewing is handled in service layer via adminClient()
CREATE POLICY tontine_applications_select ON tontine_applications
  FOR SELECT USING (user_id = auth.uid());

-- Verify the policy is applied
SELECT * FROM pg_policies WHERE tablename = 'tontine_applications';
