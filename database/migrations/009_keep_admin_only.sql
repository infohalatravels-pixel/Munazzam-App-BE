-- Keep only the seeded admin user. Remove all other users and their related data.
-- Admin: admin@nasaq.qa / Admin@12345

-- Child rows for every non-admin user
DELETE FROM refresh_tokens
WHERE user_id IN (
  SELECT id FROM users WHERE email IS DISTINCT FROM 'admin@nasaq.qa'
);

DELETE FROM attendance
WHERE user_id IN (
  SELECT id FROM users WHERE email IS DISTINCT FROM 'admin@nasaq.qa'
);

DELETE FROM activity_logs
WHERE user_id IN (
  SELECT id FROM users WHERE email IS DISTINCT FROM 'admin@nasaq.qa'
)
OR user_id IS NULL;

-- Announcements created by non-admins (and clear all for a clean slate)
DELETE FROM announcements;

-- Drop leftover accounts tables if they still exist
DROP TABLE IF EXISTS salary_transfers CASCADE;
DROP TABLE IF EXISTS journal_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;

-- Remove every user except the seeded admin
DELETE FROM users
WHERE email IS DISTINCT FROM 'admin@nasaq.qa';

-- Ensure admin seed is present and active
INSERT INTO users (
  email,
  password_hash,
  role_id,
  employee_type_id,
  first_name,
  last_name,
  job_title,
  employee_code,
  is_active,
  deleted_at
) VALUES (
  'admin@nasaq.qa',
  '$2b$12$6H6EKC714SCRcXQAc0x1qOr97FPDBvwjmUc44sFqV73jFBJ55xXd2',
  (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
  (SELECT id FROM employee_types WHERE name = 'permanent' LIMIT 1),
  'System',
  'Administrator',
  'Administrator',
  'EMP-0001',
  TRUE,
  NULL
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  employee_type_id = EXCLUDED.employee_type_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  job_title = EXCLUDED.job_title,
  employee_code = EXCLUDED.employee_code,
  is_active = TRUE,
  deleted_at = NULL,
  department_id = NULL,
  phone = NULL,
  avatar_url = NULL,
  salary = NULL,
  last_salary_transfer_date = NULL,
  office_location_id = NULL,
  work_start_time = NULL,
  work_end_time = NULL,
  project_latitude = NULL,
  project_longitude = NULL,
  project_radius_meters = NULL,
  updated_at = NOW();

-- Clear admin session tokens / logs for a clean login
DELETE FROM refresh_tokens
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@nasaq.qa' LIMIT 1);

DELETE FROM attendance
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@nasaq.qa' LIMIT 1);

DELETE FROM activity_logs
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@nasaq.qa' LIMIT 1);
