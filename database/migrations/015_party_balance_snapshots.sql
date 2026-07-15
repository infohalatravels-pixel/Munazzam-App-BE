-- Migration 015: snapshot party balances on vendor/client transactions

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS party_opening_balance NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS party_closing_balance NUMERIC(14, 2);
