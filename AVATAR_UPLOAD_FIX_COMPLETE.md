# Avatar Upload Issue - Root Cause & Fix

## Problem Summary

When tutors completed onboarding, their profile photos were NOT being saved to the database correctly, resulting in `avatar_url = NULL` in the tutors table.

## Root Cause

**WRONG BUCKET REFERENCES** - The system has two storage flows:

1. **Draft Storage (Correct)**: During onboarding, files are uploaded to the `drafts` bucket ✅
2. **Form Submission (Incorrect)**: When submitting the form, the code was trying to get URLs from wrong buckets:
   - Profile photos: Looking in `avatars` bucket instead of `drafts` ❌
   - Intro videos: Looking in `videos` bucket instead of `drafts` ❌

### The Flow

```
User uploads photo → Saved to drafts bucket ✅
                  ↓
Form submission → Tries to get URL from avatars bucket ❌
                  ↓
No file found → avatar_url = NULL ❌
                  ↓
Saved to database with NULL value ❌
```

## Understanding Draft vs Permanent Storage

### Your Question: "Are they permanently saved or only in draft?"

**Answer**: Currently, files ARE permanently saved, but in the `drafts` bucket:

1. **During Onboarding**:
   - Files uploaded → Stored in `drafts` bucket
   - Metadata saved → `tutor_onboarding_drafts` table
   - Purpose: Allow users to refresh page without losing progress

2. **After Submission**:
   - Form data → Saved to `tutors` table permanently ✅
   - File URLs → Should reference files in `drafts` bucket ✅
   - Files remain in `drafts` bucket (they don't move) ✅

3. **The Draft System Purpose**:
   - NOT temporary storage
   - Allows resuming onboarding after refresh
   - Files stay in drafts bucket permanently
   - Only the metadata in `tutor_onboarding_drafts` table can be cleaned up later

## Files Fixed

### 1. `app/onboarding/tutor/page.tsx`
**Lines 1036-1044**: Changed from `avatars` bucket to `drafts` bucket
```typescript
// BEFORE (Wrong)
.from('avatars')

// AFTER (Correct)
.from('drafts')
```

**Lines 1046-1054**: Changed from `videos` bucket to `drafts` bucket
```typescript
// BEFORE (Wrong)
.from('videos')

// AFTER (Correct)
.from('drafts')
```

### 2. `app/api/onboarding/tutor/route.ts`
**Lines 35-58**: Removed fallback logic that looked in wrong buckets
- Now only uses `profilePhotoUrl` from request body
- No longer tries to search `avatars` bucket

**Lines 60-79**: Removed fallback logic for videos
- Now only uses `introVideoUrl` from request body
- No longer tries to search `videos` bucket

### 3. `app/find-tutors/page.tsx`
**Lines 405-435**: Fixed fallback avatar rendering
- Changed from inline style to proper conditional rendering
- Now properly shows initial letter when avatar_url is NULL

## How to Fix Existing Data

### For Nicea nia (or any tutor with NULL avatar_url):

1. **Find the file in Supabase Storage**:
   - Go to Supabase Dashboard → Storage → drafts bucket
   - Navigate to: `[user_id]/profile_photo/`
   - Copy the full file path

2. **Run SQL to update**:
   ```sql
   UPDATE tutors
   SET avatar_url = 'https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/[FULL_PATH]'
   WHERE name = 'Nicea nia';
   ```

3. **Or ask user to re-upload**:
   - User goes through onboarding again
   - With the fix in place, it will save correctly

## Testing the Fix

### For New Tutors:
1. Start tutor onboarding
2. Upload profile photo
3. Complete all steps
4. Submit form
5. Check database:
   ```sql
   SELECT name, avatar_url FROM tutors ORDER BY created_at DESC LIMIT 1;
   ```
6. Should see full URL to drafts bucket ✅

### Expected Result:
```
avatar_url: https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/[user_id]/profile_photo/[filename]
```

## Why This Happened

The system was designed with the idea of moving files from `drafts` to permanent buckets (`avatars`, `videos`) after submission, but that migration logic was never implemented. Instead, files should just stay in the `drafts` bucket permanently, and the URLs should reference them there.

## Future Considerations

### Option 1: Keep Current Approach (Recommended)
- Files stay in `drafts` bucket permanently
- Simple, works well
- No file migration needed

### Option 2: Implement File Migration
- After submission, copy files from `drafts` to `avatars`/`videos`
- Update URLs to point to new location
- Clean up old files in drafts
- More complex, but cleaner separation

For now, Option 1 is implemented and working correctly.
