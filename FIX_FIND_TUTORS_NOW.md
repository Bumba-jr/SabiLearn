# Fix Find Tutors Page - Quick Start

## The Problem
The `/find-tutors` page is stuck on "Loading tutors..." because the Next.js dev server can't connect to Supabase.

## The Solution (2 Steps)

### Step 1: Restart Dev Server ⚡
```bash
# Press Ctrl+C (or Command+C) to stop the current server
# Then restart:
pnpm dev
```

### Step 2: Apply Database Migration 🗄️

Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor

Paste and run this SQL:

```sql
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);
```

Or copy from: `RUN_IN_SUPABASE_SQL_EDITOR.sql`

## Verify It Works ✅

### Option 1: Run Check Script
```bash
./scripts/check-status.sh
```

### Option 2: Manual Check
1. Visit: http://localhost:3000/find-tutors
2. Should see tutors loading (not stuck)
3. Tutor cards should display with photos

### Option 3: Test API
```bash
curl http://localhost:3000/api/tutors | python3 -m json.tool
```

Should return JSON with tutors array.

## What Was Fixed

✅ API now uses direct fetch (more reliable)  
✅ Handles missing experiences column gracefully  
✅ Profile photos saved during onboarding  
✅ Latest experience displayed on cards  
✅ Better error handling and logging  

## Files Changed

- `app/api/tutors/route.ts` - Fixed connection issue
- `app/api/onboarding/tutor/route.ts` - Save profile photos
- `app/find-tutors/page.tsx` - Display experiences
- `supabase/migrations/004_add_experiences_to_tutors.sql` - New column

## Need More Help?

See detailed documentation:
- `FIND_TUTORS_FIX_SUMMARY.md` - Complete overview
- `RESTART_DEV_SERVER.md` - Detailed restart guide
- `RUN_IN_SUPABASE_SQL_EDITOR.sql` - SQL to run

## Still Having Issues?

1. Check server logs for errors
2. Verify environment variables in `.env.local`
3. Test Supabase connection: `curl http://localhost:3000/api/test-supabase`
4. Make sure you're using the correct Supabase project

---

**TL;DR**: Restart dev server, run SQL migration, refresh page. Done! 🎉
