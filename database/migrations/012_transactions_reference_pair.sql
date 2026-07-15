-- Migration 012: allow paired transfer rows to share the same reference

DROP INDEX IF EXISTS idx_transactions_reference_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_reference_type_unique
  ON transactions (reference, transaction_type)
  WHERE deleted_at IS NULL AND reference IS NOT NULL;
