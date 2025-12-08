-- Migration: add locale, currency, timezone to users table
-- Run this in your Supabase/Postgres instance

BEGIN;

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS locale varchar(32) DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS currency varchar(8) DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS timezone varchar(128) DEFAULT NULL;

COMMIT;
