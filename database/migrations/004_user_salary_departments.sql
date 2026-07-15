-- Migration 004: employee salary fields + static departments

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS salary NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS last_salary_transfer_date DATE;

CREATE INDEX IF NOT EXISTS idx_users_salary
  ON users (salary)
  WHERE deleted_at IS NULL;

-- Static departments for user management modals
INSERT INTO departments (name, description)
VALUES
  ('Operations', 'Field and site operations'),
  ('IT / Tech', 'Information technology and systems'),
  ('Finance', 'Finance and accounting'),
  ('Human Resources', 'People and HR operations'),
  ('Logistics', 'Supply chain and logistics'),
  ('Administration', 'Corporate administration'),
  ('Construction', 'Construction and project sites')
ON CONFLICT (name) DO NOTHING;
