-- Nasaq Initial Schema Migration
-- RLS disabled: backend uses Supabase service role key exclusively.
-- Default admin seed: admin@nasaq.qa / Admin@12345 (bcrypt cost 12)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50)  NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  CONSTRAINT roles_name_unique UNIQUE (name)
);

CREATE INDEX idx_roles_name ON roles (name) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Departments
-- ---------------------------------------------------------------------------
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  CONSTRAINT departments_name_unique UNIQUE (name)
);

CREATE INDEX idx_departments_name ON departments (name) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Employee types
-- ---------------------------------------------------------------------------
CREATE TABLE employee_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50)  NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  CONSTRAINT employee_types_name_unique UNIQUE (name)
);

CREATE INDEX idx_employee_types_name ON employee_types (name) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  role_id           UUID         NOT NULL REFERENCES roles (id),
  department_id     UUID         REFERENCES departments (id),
  employee_type_id  UUID         NOT NULL REFERENCES employee_types (id),
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  phone             VARCHAR(30),
  avatar_url        TEXT,
  job_title         VARCHAR(150),
  employee_code     VARCHAR(50),
  salary            NUMERIC(12, 2),
  last_salary_transfer_date DATE,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_employee_code_unique UNIQUE (employee_code)
);

CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role_id ON users (role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_department_id ON users (department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_employee_type_id ON users (employee_type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON users (is_active) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Refresh tokens
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users (id),
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked_at  TIMESTAMPTZ,
  user_agent  TEXT,
  ip          VARCHAR(45),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash) WHERE deleted_at IS NULL;
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------
CREATE TABLE attendance (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID           NOT NULL REFERENCES users (id),
  type                  VARCHAR(20)    NOT NULL,
  latitude              NUMERIC(10, 7),
  longitude             NUMERIC(10, 7),
  address               TEXT,
  device                VARCHAR(100),
  browser               VARCHAR(100),
  distance_from_office  NUMERIC(10, 2),
  is_within_radius      BOOLEAN,
  marked_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  CONSTRAINT attendance_type_check CHECK (
    type IN ('check_in', 'check_out', 'late', 'absent', 'leave', 'half_day')
  )
);

CREATE INDEX idx_attendance_user_id ON attendance (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_marked_at ON attendance (marked_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_type ON attendance (type) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_user_marked_at ON attendance (user_id, marked_at DESC) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Settings (key-value JSONB)
-- ---------------------------------------------------------------------------
CREATE TABLE settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(100) NOT NULL,
  value       JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  CONSTRAINT settings_key_unique UNIQUE (key)
);

CREATE INDEX idx_settings_key ON settings (key) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Activity logs
-- ---------------------------------------------------------------------------
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES users (id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB        NOT NULL DEFAULT '{}',
  ip          VARCHAR(45),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_logs_action ON activity_logs (action) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_logs_entity ON activity_logs (entity_type, entity_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------
CREATE TABLE announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  content      TEXT         NOT NULL,
  created_by   UUID         NOT NULL REFERENCES users (id),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_announcements_created_by ON announcements (created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_is_active ON announcements (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_published_at ON announcements (published_at DESC) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Disable RLS (service role access only)
-- ---------------------------------------------------------------------------
ALTER TABLE roles           DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments     DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_types  DISABLE ROW LEVEL SECURITY;
ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens  DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance      DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings        DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs   DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements   DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed: roles
-- ---------------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('admin',    'Full system administrator with unrestricted access'),
  ('hr',       'Human resources manager with employee management access'),
  ('employee', 'Standard employee with self-service access');

-- ---------------------------------------------------------------------------
-- Seed: employee types
-- ---------------------------------------------------------------------------
INSERT INTO employee_types (name, description) VALUES
  ('permanent', 'Permanent full-time or part-time employee'),
  ('contract',  'Contract-based or temporary employee');

-- ---------------------------------------------------------------------------
-- Seed: static departments
-- ---------------------------------------------------------------------------
INSERT INTO departments (name, description) VALUES
  ('Operations', 'Field and site operations'),
  ('IT / Tech', 'Information technology and systems'),
  ('Finance', 'Finance and accounting'),
  ('Human Resources', 'People and HR operations'),
  ('Logistics', 'Supply chain and logistics'),
  ('Administration', 'Corporate administration'),
  ('Construction', 'Construction and project sites');

-- ---------------------------------------------------------------------------
-- Seed: default settings (Doha, Qatar office defaults)
-- ---------------------------------------------------------------------------
INSERT INTO settings (key, value) VALUES
  ('office_lat',           '25.2854'),
  ('office_lng',           '51.5310'),
  ('office_radius_meters', '200'),
  ('office_locations',       '[
    {"id":"qatar-doha","name":"Doha Office, Qatar","latitude":25.2854,"longitude":51.5310,"radiusMeters":500},
    {"id":"pakistan-lahore","name":"Lahore Office, Pakistan","latitude":31.5015,"longitude":74.2440,"radiusMeters":1000}
  ]'::jsonb),
  ('company_name',         '"Nasaq"'),
  ('work_start_time',      '"08:00"'),
  ('work_end_time',        '"17:00"'),
  ('late_threshold_minutes', '15');

-- ---------------------------------------------------------------------------
-- Seed: default admin user
-- Credentials (document only): admin@nasaq.qa / Admin@12345
-- ---------------------------------------------------------------------------
INSERT INTO users (
  email,
  password_hash,
  role_id,
  employee_type_id,
  first_name,
  last_name,
  job_title,
  employee_code,
  is_active
) VALUES (
  'admin@nasaq.qa',
  '$2b$12$6H6EKC714SCRcXQAc0x1qOr97FPDBvwjmUc44sFqV73jFBJ55xXd2',
  (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
  (SELECT id FROM employee_types WHERE name = 'permanent' LIMIT 1),
  'System',
  'Administrator',
  'Administrator',
  'EMP-0001',
  TRUE
);
