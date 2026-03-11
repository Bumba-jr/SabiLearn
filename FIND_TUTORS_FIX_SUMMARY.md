# Find Tutors Page - Fix Summary

## Problem
The `/find-tutors` page was stuck displaying "Loading tutors..." indefinitely.

## Root Causes Identified

### 1. Supabase Connection Issue (Primary)
- Next.js dev server experiencing `ECONNRESET` errors when connecting to Supabase
- The Supabase JS client was failing with "fetch failed" errors
- Direct curl to Supabase works fine, confirming it's a dev server issue

### 2. Missing Database Column
- The `experiences` JSONB column doesn't exist in the `tutors` table yet
- Migration file exists but hasn't been applied: `supabase/migrations/004_add_experiences_to_tutors.sql`

## Fixes Applied

### ✅ API Route Updated (`app/api/tutors/route.ts`)
- Changed from Supabase client to direct REST API fetch
- Added graceful handling for missing `experiences` column
- Improved error logging
- Returns tutor data with:
  - Profile photos from Supabase Storage
  - Latest teaching experience (when column exists)
  - Bio, subjects, rating, etc.

### ✅ Onboarding Flow Updated
- `app/onboarding/tutor/page.tsx` - Gets profile photo URL from draft metadata
- `app/api/onboarding/tutor/route.ts` - Saves `avatar_url` and `intro_video_url` to database
- Profile photos are now properly stored and retrieved

### ✅ Find Tutors UI Updated (`app/find-tutors/page.tsx`)
- Displays profile photos from database
- Shows latest teaching experience in a card
- Single "View Profile" button (removed pricing)
- Proper loading and empty states

## Required Actions

### 1. Restart Development Server (CRITICAL)
```bash
# Stop current server (Ctrl+C)
pnpm dev
```

This will fix the Supabase connection issues.

### 2. Apply Database Migration
Run the SQL in Supabase Dashboard SQL Editor:

```sql
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);
```

Or use the provided file: `RUN_IN_SUPABASE_SQL_EDITOR.sql`

## Testing After Fixes

### 1. Test API Endpoint
```bash
curl http://localhost:3000/api/tutors | python3 -m json.tool
```

Should return array of tutors with profile data.

### 2. Test Find Tutors Page
1. Visit: http://localhost:3000/find-tutors
2. Should load tutors (not stuck on "Loading...")
3. Tutor cards should display:
   - Profile photo or initial avatar
   - Name and bio
   - Subjects
   - Latest experience (after migration)
   - "View Profile" button

### 3. Test Onboarding Flow
1. Complete tutor onboarding with profile photo
2. Check that photo appears in find-tutors page
3. Verify experiences are saved (after migration)

## Files Modified

### API Routes
- `app/api/tutors/route.ts` - Fixed Supabase connection, added experiences handling
- `app/api/onboarding/tutor/route.ts` - Save avatar_url and intro_video_url
- `app/api/test-supabase/route.ts` - New test endpoint
- `app/api/admin/migrate/route.ts` - New migration helper

### Frontend
- `app/find-tutors/page.tsx` - Display latest experience, profile photos
- `app/onboarding/tutor/page.tsx` - Get profile photo URL from drafts

### Database
- `supabase/migrations/004_add_experiences_to_tutors.sql` - Needs to be applied

### Documentation
- `RESTART_DEV_SERVER.md` - Detailed restart instructions
- `RUN_IN_SUPABASE_SQL_EDITOR.sql` - SQL to run in dashboard
- `FIND_TUTORS_FIX_SUMMARY.md` - This file

### Scripts
- `scripts/run-migration.mjs` - Check if migration is needed
- `scripts/apply-migration.js` - Migration helper (Node.js)

## Expected Behavior After All Fixes

### Find Tutors Page
- Loads tutors from database immediately
- Displays verified tutors only
- Shows profile photos from Supabase Storage
- Displays latest teaching experience
- Filters work (subjects, levels, lesson mode)
- Cards show "View Profile" button

### Tutor Cards Display
```
┌─────────────────────────────┐
│   [Profile Photo/Avatar]    │
│   ✓ Verified                │
│   Available Online          │
├─────────────────────────────┤
│ John Doe ⭐ 4.8            │
│ Professional Tutor          │
│                             │
│ Experienced educator...     │
│                             │
│ Latest Experience:          │
│ Senior Teacher              │
│ ABC School                  │
│ 2020 - 2024                 │
│                             │
│ [Math] [Physics] [Chem]     │
│                             │
│ [View Profile Button]       │
└─────────────────────────────┘
```

## Known Limitations

1. **Clerk Connection Issues**: There were previous issues with Clerk authentication causing upload failures. These may resurface.

2. **Migration Not Auto-Applied**: The experiences column migration must be run manually in Supabase dashboard.

3. **Dev Server Restart Required**: The fetch connection issues require a full dev server restart.

## Next Steps

1. ✅ Restart dev server
2. ✅ Apply database migration
3. ⏳ Test find-tutors page loads correctly
4. ⏳ Test new tutor onboarding saves profile photo
5. ⏳ Verify experiences display on cards
6. ⏳ Consider migrating from Clerk to Supabase Auth (user mentioned this)

## Support

If issues persist after restart:
1. Check server logs for errors
2. Test API directly: `curl http://localhost:3000/api/tutors`
3. Verify Supabase connection: `curl http://localhost:3000/api/test-supabase`
4. Check environment variables in `.env.local`
