-- Fix tutors table schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vgmflkoykskpqxryrdsp/sql

-- First, check if user_id column is TEXT or UUID
DO $$
BEGIN
    -- If user_id is TEXT and we want to use UUIDs, we need to handle this carefully
    -- For now, we'll keep user_id as TEXT for backward compatibility
    -- and use auth_user_id as UUID for new Supabase Auth integration
    
    -- Add missing columns to tutors table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE tutors ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added auth_user_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'experience_level'
    ) THEN
        ALTER TABLE tutors ADD COLUMN experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert'));
        RAISE NOTICE 'Added experience_level column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'grade_levels'
    ) THEN
        ALTER TABLE tutors ADD COLUMN grade_levels JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added grade_levels column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'intro_video_url'
    ) THEN
        ALTER TABLE tutors ADD COLUMN intro_video_url TEXT;
        RAISE NOTICE 'Added intro_video_url column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'credentials_urls'
    ) THEN
        ALTER TABLE tutors ADD COLUMN credentials_urls JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added credentials_urls column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE tutors ADD COLUMN bank_name TEXT;
        RAISE NOTICE 'Added bank_name column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'account_number'
    ) THEN
        ALTER TABLE tutors ADD COLUMN account_number TEXT;
        RAISE NOTICE 'Added account_number column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'account_name'
    ) THEN
        ALTER TABLE tutors ADD COLUMN account_name TEXT;
        RAISE NOTICE 'Added account_name column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'availability'
    ) THEN
        ALTER TABLE tutors ADD COLUMN availability JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added availability column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutors' AND column_name = 'experiences'
    ) THEN
        ALTER TABLE tutors ADD COLUMN experiences JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added experiences column';
    END IF;
END $$;

-- Add unique constraint on auth_user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tutors_auth_user_id_key'
    ) THEN
        ALTER TABLE tutors ADD CONSTRAINT tutors_auth_user_id_key UNIQUE (auth_user_id);
        RAISE NOTICE 'Added unique constraint on auth_user_id';
    END IF;
END $$;

-- Create index on auth_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_tutors_auth_user_id ON tutors(auth_user_id);

-- Create index on experiences for better query performance
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);

-- Create index on grade_levels for better query performance
CREATE INDEX IF NOT EXISTS idx_tutors_grade_levels ON tutors USING GIN (grade_levels);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tutors'
ORDER BY ordinal_position;
