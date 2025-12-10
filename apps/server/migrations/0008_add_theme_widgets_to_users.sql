-- Migration: add theme and widgets to users table
-- Run this in your Supabase/Postgres instance

BEGIN;

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS theme varchar(20) DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS widgets jsonb DEFAULT '["dashboard", "transactions"]'::jsonb;

COMMIT;
