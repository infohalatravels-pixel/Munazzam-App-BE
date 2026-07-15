-- Migration 013: vendors and clients directories

CREATE TABLE IF NOT EXISTS vendors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  vendor_type  JSONB        NOT NULL DEFAULT '[]'::jsonb,
  balance      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  CONSTRAINT vendors_balance_nonnegative CHECK (balance >= 0),
  CONSTRAINT vendors_vendor_type_is_array CHECK (jsonb_typeof(vendor_type) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_vendors_name
  ON vendors (name) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_name_unique
  ON vendors (lower(name)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_vendor_type
  ON vendors USING GIN (vendor_type) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  services     JSONB        NOT NULL DEFAULT '[]'::jsonb,
  balance      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  CONSTRAINT clients_balance_nonnegative CHECK (balance >= 0),
  CONSTRAINT clients_services_is_array CHECK (jsonb_typeof(services) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_clients_name
  ON clients (name) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_name_unique
  ON clients (lower(name)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_services
  ON clients USING GIN (services) WHERE deleted_at IS NULL;
