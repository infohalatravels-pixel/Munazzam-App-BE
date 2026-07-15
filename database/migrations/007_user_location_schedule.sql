-- Migration 007: per-employee project location + work schedule

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS office_location_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS work_start_time VARCHAR(5),
  ADD COLUMN IF NOT EXISTS work_end_time VARCHAR(5);

CREATE INDEX IF NOT EXISTS idx_users_office_location
  ON users (office_location_id)
  WHERE deleted_at IS NULL AND office_location_id IS NOT NULL;
