-- Migration 014: vendor/client payments, clears, signed balances, line items

-- Allow signed outstanding balances (overpay → negative = credit)
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_balance_nonnegative;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_balance_nonnegative;

-- Extend transactions for vendor/client party + payment mode
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors (id),
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients (id),
  ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20);

-- Relax amount constraints so advance / overpay is allowed
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_paid_not_exceed_total;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_remaining_amount_nonnegative;

-- Expand allowed transaction types
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check CHECK (
    transaction_type IN (
      'deposit',
      'transfer_in',
      'transfer_out',
      'payroll',
      'utility',
      'payable',
      'receivable',
      'vendor_payment',
      'vendor_clear',
      'client_payment',
      'client_clear'
    )
  );

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payment_mode_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_payment_mode_check CHECK (
    payment_mode IS NULL
    OR payment_mode IN ('unpaid', 'partial', 'full', 'advance', 'clear')
  );

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_vendor_required_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_vendor_required_check CHECK (
    transaction_type NOT IN ('vendor_payment', 'vendor_clear')
    OR vendor_id IS NOT NULL
  );

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_client_required_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_client_required_check CHECK (
    transaction_type NOT IN ('client_payment', 'client_clear')
    OR client_id IS NOT NULL
  );

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_party_exclusive_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_party_exclusive_check CHECK (
    NOT (vendor_id IS NOT NULL AND client_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_transactions_vendor
  ON transactions (vendor_id) WHERE deleted_at IS NULL AND vendor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_client
  ON transactions (client_id) WHERE deleted_at IS NULL AND client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_mode
  ON transactions (payment_mode) WHERE deleted_at IS NULL AND payment_mode IS NOT NULL;

-- Line items: vendor products
CREATE TABLE IF NOT EXISTS transaction_vendor_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES transactions (id) ON DELETE CASCADE,
  product_name    VARCHAR(200) NOT NULL,
  unit_price      NUMERIC(14, 2) NOT NULL,
  quantity        NUMERIC(14, 3),
  line_total      NUMERIC(14, 2) NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transaction_vendor_items_unit_price_positive CHECK (unit_price > 0),
  CONSTRAINT transaction_vendor_items_quantity_positive CHECK (quantity IS NULL OR quantity > 0),
  CONSTRAINT transaction_vendor_items_line_total_positive CHECK (line_total > 0)
);

CREATE INDEX IF NOT EXISTS idx_transaction_vendor_items_txn
  ON transaction_vendor_items (transaction_id);

-- Line items: client services
CREATE TABLE IF NOT EXISTS transaction_client_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES transactions (id) ON DELETE CASCADE,
  service_name    VARCHAR(200) NOT NULL,
  amount          NUMERIC(14, 2) NOT NULL,
  description     TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transaction_client_items_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_transaction_client_items_txn
  ON transaction_client_items (transaction_id);
