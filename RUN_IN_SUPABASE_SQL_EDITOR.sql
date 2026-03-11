-- Run this in Supabase SQL Editor to add experiences column
-- Dashboard: https://supabase.com/dashboard → Your Project → SQL Editor

-- Add experiences column to tutors table
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);

-- Add helpful comment
COMMENT ON COLUMN tutors.experiences IS 'Array of teaching experience objects with post, institute, instituteState, fromYear, toYear, description';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tutors' AND column_name = 'experiences';

-- Show sample data
SELECT id, name, experiences 
FROM tutors 
LIMIT 3;
