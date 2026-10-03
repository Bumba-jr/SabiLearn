-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Adds the student-profile columns the onboarding API writes to
-- (bio, gender, date_of_birth, location, grade_levels, exam_types).

ALTER TABLE students ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade_levels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS exam_types JSONB DEFAULT '[]'::jsonb;

--subjects_needed exists from migration 002; mirror the onboarding subjects
-- into it is handled by the API writing 'subjects' — add it too if missing:
ALTER TABLE students ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb;
