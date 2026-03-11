# Apply Experiences Migration

## What This Does
Adds an `experiences` column to the tutors table to store teaching experience history.

## How to Apply

### Option 1: Using Supabase CLI (Recommended)
```bash
supabase db push
```

### Option 2: Manual SQL Execution
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Add experiences column to tutors table
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;

-- Add index for experiences
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);

-- Add comment
COMMENT ON COLUMN tutors.experiences IS 'Array of teaching experience objects with post, institute, instituteState, fromYear, toYear, description';
```

## What's Changed

### Database
- Added `experiences` JSONB column to `tutors` table
- Stores array of experience objects with:
  - `post`: Job title/position
  - `institute`: School/institution name
  - `instituteState`: Location
  - `fromYear`: Start year
  - `toYear`: End year
  - `description`: Job description

### API (`app/api/onboarding/tutor/route.ts`)
- Now saves experiences array to database during onboarding

### Tutors API (`app/api/tutors/route.ts`)
- Fetches experiences from database
- Returns the most recent experience for each tutor

### Find Tutors Page (`app/find-tutors/page.tsx`)
- Displays latest teaching experience on tutor cards
- Shows position, institution, and years

## Example Experience Display
```
Latest Experience
Mathematics Teacher
Lagos State Model College
2020 - 2024
```

## Testing
1. Complete tutor onboarding with teaching experience
2. Visit `/find-tutors`
3. Verify the latest experience appears on the tutor card
