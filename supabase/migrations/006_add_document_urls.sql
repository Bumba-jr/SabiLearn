-- Migration: Add document URL columns to tutors table
-- Description: Add columns for storing URLs to uploaded documents

-- Add columns for document URLs
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS degree_certificate_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS government_id_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS nysc_certificate_url TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN tutors.degree_certificate_url IS 'URL to degree certificate document in storage';
COMMENT ON COLUMN tutors.government_id_url IS 'URL to government ID document in storage';
COMMENT ON COLUMN tutors.nysc_certificate_url IS 'URL to NYSC certificate document in storage';
