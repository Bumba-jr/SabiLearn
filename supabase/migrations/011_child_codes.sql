-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Adds shareable child codes so parents/children can link accounts.

ALTER TABLE students ADD COLUMN IF NOT EXISTS child_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS students_child_code_key ON students (child_code);

-- Backfill codes for existing children
UPDATE students
SET child_code = 'SB-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6))
WHERE child_code IS NULL;
