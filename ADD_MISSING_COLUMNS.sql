-- Add missing columns to tutors table
-- Run this in Supabase SQL Editor

-- Add auth_user_id column
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tutors_auth_user_id_fkey'
    ) THEN
        ALTER TABLE tutors ADD CONSTRAINT tutors_auth_user_id_fkey 
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tutors_auth_user_id_key'
    ) THEN
        ALTER TABLE tutors ADD CONSTRAINT tutors_auth_user_id_key UNIQUE (auth_user_id);
    END IF;
END $$;

-- Add other missing columns
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS grade_levels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS credentials_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;

-- Add check constraint for experience_level
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tutors_experience_level_check'
    ) THEN
        ALTER TABLE tutors ADD CONSTRAINT tutors_experience_level_check 
        CHECK (experience_level IN ('beginner', 'intermediate', 'expert'));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tutors_auth_user_id ON tutors(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_grade_levels ON tutors USING GIN (grade_levels);
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tutors'
ORDER BY ordinal_position;
