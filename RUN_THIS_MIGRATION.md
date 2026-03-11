# Run This Migration Now

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

## Step 2: Copy and Run This SQL

```sql
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
```

## Step 3: Click "Run"

You should see: "Success. No rows returned"

## Step 4: Verify

Run this query to verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tutors' 
AND column_name IN ('degree_certificate_url', 'government_id_url', 'nysc_certificate_url');
```

You should see 3 rows returned showing the new columns.

## Done!

Now all new tutor onboardings will save document URLs to the database permanently.

Test by:
1. Creating a new tutor account
2. Completing onboarding with all documents
3. Checking the admin panel to see documents displayed
