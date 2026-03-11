-- Add experiences column to tutors table
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;

-- Add index for experiences
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);

-- Add comment
COMMENT ON COLUMN tutors.experiences IS 'Array of teaching experience objects with post, institute, instituteState, fromYear, toYear, description';
