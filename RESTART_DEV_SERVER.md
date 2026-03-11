# Development Server Restart Required

## Issue
The find-tutors page is stuck on "Loading tutors..." because the Next.js development server is experiencing connection issues with Supabase (ECONNRESET error).

## Root Cause
The Next.js dev server has cached connections or is experiencing network issues preventing it from connecting to Supabase, even though Supabase is accessible (verified via direct curl).

## Solution
**Restart the development server:**

```bash
# Stop the current server (Ctrl+C or Command+C)
# Then restart it:
pnpm dev
```

## What Was Fixed
1. ✅ Updated `/app/api/tutors/route.ts` to use direct fetch instead of Supabase client
2. ✅ Added better error handling and logging
3. ✅ Made the API handle missing `experiences` column gracefully
4. ✅ Profile photos and intro videos are now saved during onboarding

## After Restart
The find-tutors page should load tutors correctly and display:
- Profile photos (from Supabase Storage)
- Latest teaching experience
- Bio and subjects
- "View Profile" button

## Still Need to Apply
The database migration for the `experiences` column:

**Option 1: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Run this SQL:

```sql
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);
COMMENT ON COLUMN tutors.experiences IS 'Array of teaching experience objects';
```

**Option 2: Via Migration Script**
```bash
node scripts/run-migration.mjs
```
This will check if the column exists and provide instructions.

## Verification
After restarting the server, test:
1. Visit http://localhost:3000/find-tutors
2. Should see tutors loading (not stuck on "Loading tutors...")
3. Tutor cards should display with profile photos
4. Latest experience should show (once migration is applied)

## API Endpoints Updated
- `/api/tutors` - Now uses direct fetch, handles missing experiences column
- `/api/test-supabase` - Test endpoint to verify Supabase connection
- `/api/admin/migrate` - Helper endpoint for migration info
