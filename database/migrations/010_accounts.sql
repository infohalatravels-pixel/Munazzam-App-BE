-- Migration 010: institutional finance accounts (bank / cash)

CREATE TABLE IF NOT EXISTS accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ac_name     VARCHAR(150) NOT NULL,
  ac_type     VARCHAR(20)  NOT NULL,
  balance     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  CONSTRAINT accounts_ac_type_check CHECK (ac_type IN ('bank', 'cash')),
  CONSTRAINT accounts_balance_nonnegative CHECK (balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_accounts_ac_type
  ON accounts (ac_type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_ac_name
  ON accounts (ac_name) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_ac_name_unique
  ON accounts (lower(ac_name)) WHERE deleted_at IS NULL;
