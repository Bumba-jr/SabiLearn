-- Add missing document URL columns to tutors table
-- Run this in Supabase SQL Editor NOW

-- Add the three missing columns
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS degree_certificate_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS government_id_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS nysc_certificate_url TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN tutors.degree_certificate_url IS 'URL to degree certificate document in storage';
COMMENT ON COLUMN tutors.government_id_url IS 'URL to government ID document in storage';
COMMENT ON COLUMN tutors.nysc_certificate_url IS 'URL to NYSC certificate document in storage';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tutors'
AND column_name IN ('degree_certificate_url', 'government_id_url', 'nysc_certificate_url')
ORDER BY column_name;
