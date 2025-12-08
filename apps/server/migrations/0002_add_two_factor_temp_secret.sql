-- Migration: add two_factor columns to users table
-- Run this in your Supabase/Postgres instance

BEGIN;

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS two_factor_secret text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS temp_two_factor_secret text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT FALSE;

COMMIT;
