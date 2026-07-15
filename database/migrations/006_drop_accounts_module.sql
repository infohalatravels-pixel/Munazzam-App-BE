-- Migration 006: remove accounts module tables and reset payroll transfer dates

DROP TABLE IF EXISTS salary_transfers CASCADE;
DROP TABLE IF EXISTS journal_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;

-- Clear salary transfer history tied to the removed accounts/payroll flow
UPDATE users
SET last_salary_transfer_date = NULL
WHERE last_salary_transfer_date IS NOT NULL;
