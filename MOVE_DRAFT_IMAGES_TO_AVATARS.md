# Move Draft Images to Avatars Bucket

## Issue
Profile photos are currently stored in the `drafts` bucket with paths like:
`drafts/user-id/profile_photo/filename.jpg`

They should be in the `avatars` bucket for better organization.

## Quick Fix (Current)
Updated `next.config.ts` to allow images from both `avatars` and `drafts` buckets.

## Proper Solution (Future)
Move files from drafts to avatars bucket when onboarding completes.

### Manual Migration Steps

1. **In Supabase Dashboard**, go to Storage > drafts bucket
2. For each profile photo in `drafts/*/profile_photo/`:
   - Download the file
   - Upload to `avatars/user-id/` folder
   - Update the tutor's `avatar_url` in the database

### SQL to Update Avatar URLs

```sql
-- Check current avatar URLs pointing to drafts
SELECT id, name, avatar_url 
FROM tutors 
WHERE avatar_url LIKE '%/drafts/%'
LIMIT 10;

-- After manually moving files, update the URLs
-- Example: UPDATE tutors SET avatar_url = 'new-url' WHERE id = 'tutor-id';
```

### Future Enhancement

Add this logic to the onboarding API to automatically move files:

```typescript
// After successful onboarding, move draft files to permanent storage
if (body.profilePhotoUrl && body.profilePhotoUrl.includes('/drafts/')) {
    // Extract filename from draft URL
    // Download from drafts bucket
    // Upload to avatars bucket
    // Update avatar_url with new location
    // Delete from drafts bucket
}
```

## Current Status
✅ Images now display correctly from drafts bucket
⏳ File migration to avatars bucket can be done later for better organization
