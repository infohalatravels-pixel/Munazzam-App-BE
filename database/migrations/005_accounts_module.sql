-- Migration 005: Accounting module (chart, journals, salary transfers)
-- Starts with chart of accounts only — zero balances until journals are posted.

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20)  NOT NULL,
  name            VARCHAR(150) NOT NULL,
  type            VARCHAR(20)  NOT NULL,
  normal_balance  VARCHAR(10)  NOT NULL,
  description     TEXT,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  parent_id       UUID         REFERENCES chart_of_accounts (id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chart_of_accounts_code_unique UNIQUE (code),
  CONSTRAINT chart_of_accounts_type_check CHECK (
    type IN ('asset', 'liability', 'equity', 'revenue', 'expense')
  ),
  CONSTRAINT chart_of_accounts_normal_balance_check CHECK (
    normal_balance IN ('debit', 'credit')
  )
);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type
  ON chart_of_accounts (type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code
  ON chart_of_accounts (code) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number    VARCHAR(40)  NOT NULL,
  entry_date      DATE         NOT NULL,
  reference       VARCHAR(100),
  memo            TEXT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'posted',
  entry_type      VARCHAR(40)  NOT NULL DEFAULT 'manual',
  created_by      UUID         REFERENCES users (id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT journal_entries_entry_number_unique UNIQUE (entry_number),
  CONSTRAINT journal_entries_status_check CHECK (
    status IN ('draft', 'posted', 'void')
  )
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date
  ON journal_entries (entry_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_status
  ON journal_entries (status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS journal_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID        NOT NULL REFERENCES journal_entries (id),
  account_id      UUID         NOT NULL REFERENCES chart_of_accounts (id),
  description     TEXT,
  debit           NUMERIC(14, 2) NOT NULL DEFAULT 0,
  credit          NUMERIC(14, 2) NOT NULL DEFAULT 0,
  line_order      INTEGER      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT journal_lines_amount_check CHECK (
    debit >= 0 AND credit >= 0 AND NOT (debit > 0 AND credit > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry
  ON journal_lines (journal_entry_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_lines_account
  ON journal_lines (account_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS salary_transfers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID         NOT NULL REFERENCES users (id),
  amount                NUMERIC(12, 2) NOT NULL,
  transfer_date         DATE         NOT NULL,
  accrual_journal_id    UUID         REFERENCES journal_entries (id),
  payment_journal_id    UUID         REFERENCES journal_entries (id),
  created_by            UUID         REFERENCES users (id),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  CONSTRAINT salary_transfers_amount_check CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_salary_transfers_user
  ON salary_transfers (user_id, transfer_date DESC) WHERE deleted_at IS NULL;

ALTER TABLE chart_of_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries   DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines     DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_transfers  DISABLE ROW LEVEL SECURITY;

-- Seed chart of accounts (balances stay zero until journals are posted)
INSERT INTO chart_of_accounts (code, name, type, normal_balance, description)
VALUES
  ('1000', 'Cash & Bank', 'asset', 'debit', 'Operating cash and bank balances'),
  ('1100', 'Accounts Receivable', 'asset', 'debit', 'Amounts owed by customers'),
  ('1200', 'Prepaid Expenses', 'asset', 'debit', 'Expenses paid in advance'),
  ('1500', 'Equipment & Assets', 'asset', 'debit', 'Fixed assets and equipment'),
  ('2000', 'Accounts Payable', 'liability', 'credit', 'Amounts owed to vendors'),
  ('2100', 'Salaries Payable', 'liability', 'credit', 'Accrued employee salaries'),
  ('2200', 'Tax Payable', 'liability', 'credit', 'Statutory tax liabilities'),
  ('3000', 'Owner Equity', 'equity', 'credit', 'Capital and retained equity'),
  ('3100', 'Retained Earnings', 'equity', 'credit', 'Accumulated earnings'),
  ('4000', 'Service Revenue', 'revenue', 'credit', 'Income from services'),
  ('4100', 'Other Income', 'revenue', 'credit', 'Miscellaneous income'),
  ('5000', 'Salaries Expense', 'expense', 'debit', 'Employee salary expense'),
  ('5100', 'Rent Expense', 'expense', 'debit', 'Office and site rent'),
  ('5200', 'Utilities Expense', 'expense', 'debit', 'Utilities and communications'),
  ('5300', 'Operating Expense', 'expense', 'debit', 'General operating costs')
ON CONFLICT (code) DO NOTHING;
