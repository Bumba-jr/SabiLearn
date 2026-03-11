-- Add exam_types column to tutors table
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS exam_types JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tutors_exam_types ON tutors USING GIN (exam_types);

-- Update some tutors with sample exam types data
UPDATE tutors 
SET exam_types = CASE 
    WHEN subjects::text ILIKE '%mathematics%' OR subjects::text ILIKE '%physics%' OR subjects::text ILIKE '%chemistry%' THEN 
        '["JAMB", "WAEC", "NECO"]'::jsonb
    WHEN subjects::text ILIKE '%english%' THEN 
        '["JAMB", "WAEC", "IELTS", "TOEFL"]'::jsonb
    WHEN subjects::text ILIKE '%economics%' OR subjects::text ILIKE '%accounting%' THEN 
        '["JAMB", "WAEC", "ACCA"]'::jsonb
    ELSE 
        '["JAMB", "WAEC"]'::jsonb
END
WHERE exam_types = '[]'::jsonb OR exam_types IS NULL;

-- Update grade_levels for tutors who don't have them
UPDATE tutors 
SET grade_levels = CASE 
    WHEN subjects::text ILIKE '%primary%' OR bio ILIKE '%primary%' THEN 
        '["Primary 1-6", "JSS 1-3"]'::jsonb
    WHEN subjects::text ILIKE '%jamb%' OR bio ILIKE '%jamb%' OR subjects::text ILIKE '%university%' THEN 
        '["SSS 1-3", "University"]'::jsonb
    WHEN subjects::text ILIKE '%waec%' OR bio ILIKE '%waec%' THEN 
        '["JSS 1-3", "SSS 1-3"]'::jsonb
    ELSE 
        '["JSS 1-3", "SSS 1-3"]'::jsonb
END
WHERE grade_levels = '[]'::jsonb OR grade_levels IS NULL;

-- Verify the updates
SELECT 
    name,
    subjects,
    grade_levels,
    exam_types
FROM tutors
LIMIT 10;