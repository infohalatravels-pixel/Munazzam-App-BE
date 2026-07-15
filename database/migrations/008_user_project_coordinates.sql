-- Migration 008: store employee project location as map coordinates

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS project_latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS project_longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS project_radius_meters INTEGER;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_project_radius_check;

ALTER TABLE users
  ADD CONSTRAINT users_project_radius_check
  CHECK (
    project_radius_meters IS NULL
    OR (project_radius_meters >= 50 AND project_radius_meters <= 5000)
  );
