-- Migration 011: financial transactions (supports partial payments)

CREATE TABLE IF NOT EXISTS transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type        VARCHAR(30)    NOT NULL,
  source_account_id       UUID           REFERENCES accounts (id),
  destination_account_id  UUID           REFERENCES accounts (id),
  opening_balance         NUMERIC(14, 2) NOT NULL DEFAULT 0,
  closing_balance         NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount            NUMERIC(14, 2) NOT NULL,
  paid_amount             NUMERIC(14, 2) NOT NULL DEFAULT 0,
  remaining_amount        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  employee_id             UUID           REFERENCES users (id),
  reference               VARCHAR(50),
  notes                   TEXT,
  transaction_date        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  status                  VARCHAR(20)    NOT NULL DEFAULT 'completed',
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  CONSTRAINT transactions_type_check CHECK (
    transaction_type IN (
      'deposit',
      'transfer_in',
      'transfer_out',
      'payroll',
      'utility',
      'payable',
      'receivable'
    )
  ),
  CONSTRAINT transactions_status_check CHECK (
    status IN ('pending', 'partial', 'completed', 'cancelled')
  ),
  CONSTRAINT transactions_total_amount_positive CHECK (total_amount > 0),
  CONSTRAINT transactions_paid_amount_nonnegative CHECK (paid_amount >= 0),
  CONSTRAINT transactions_remaining_amount_nonnegative CHECK (remaining_amount >= 0),
  CONSTRAINT transactions_paid_not_exceed_total CHECK (paid_amount <= total_amount),
  CONSTRAINT transactions_partial_payment_balance CHECK (
    remaining_amount = total_amount - paid_amount
  ),
  CONSTRAINT transactions_accounts_distinct CHECK (
    source_account_id IS NULL
    OR destination_account_id IS NULL
    OR source_account_id <> destination_account_id
  ),
  CONSTRAINT transactions_payroll_employee_required CHECK (
    transaction_type <> 'payroll' OR employee_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON transactions (transaction_type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON transactions (status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_source_account
  ON transactions (source_account_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_destination_account
  ON transactions (destination_account_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_employee
  ON transactions (employee_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions (transaction_date DESC) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_reference_unique
  ON transactions (reference) WHERE deleted_at IS NULL AND reference IS NOT NULL;
