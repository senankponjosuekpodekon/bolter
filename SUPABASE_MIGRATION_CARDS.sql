-- Create cards table in Supabase
-- Execute this SQL in your Supabase SQL Editor (https://app.supabase.com)

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  card_number VARCHAR(16) NOT NULL UNIQUE,
  type VARCHAR(10) NOT NULL DEFAULT 'VIRTUAL' CHECK (type IN ('VIRTUAL', 'PHYSICAL')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'EXPIRED')),
  cvv VARCHAR(4) NOT NULL,
  expiry_date VARCHAR(7) NOT NULL,
  cardholder_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON cards(card_number);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);

-- Enable Row Level Security (recommended for security)
-- Uncomment these lines if you want to enable RLS
-- ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view their own cards" ON cards
--   FOR SELECT USING (
--     auth.uid() IN (
--       SELECT user_id FROM accounts WHERE id = cards.account_id
--     )
--   );
-- 
-- CREATE POLICY "Users can create cards for their accounts" ON cards
--   FOR INSERT WITH CHECK (
--     auth.uid() IN (
--       SELECT user_id FROM accounts WHERE id = cards.account_id
--     )
--   );
-- 
-- CREATE POLICY "Users can update their own cards" ON cards
--   FOR UPDATE USING (
--     auth.uid() IN (
--       SELECT user_id FROM accounts WHERE id = cards.account_id
--     )
--   );
-- 
-- CREATE POLICY "Users can delete their own cards" ON cards
--   FOR DELETE USING (
--     auth.uid() IN (
--       SELECT user_id FROM accounts WHERE id = cards.account_id
--     )
--   );
