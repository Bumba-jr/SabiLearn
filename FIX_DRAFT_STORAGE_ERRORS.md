# Fix Draft Storage Errors

## Issues Found

Your draft storage system has these problems:

1. **Database table doesn't exist** - Migration not applied
2. **Storage bucket doesn't exist** - Needs manual creation
3. **RLS policies incompatible with Clerk** - Fixed in migrations
4. **Multiple Supabase client warnings** - Minor issue

## Quick Fix Steps

### 1. Apply Database Migration

Run this in your Supabase SQL Editor:

```bash
# Copy the migration content
cat supabase/migrations/003_tutor_onboarding_drafts.sql
```

Then paste and execute in: https://supabase.com/dashboard/project/vgmflkoykskpqxryrdsp/sql/new

### 2. Create Storage Bucket

Go to: https://supabase.com/dashboard/project/vgmflkoykskpqxryrdsp/storage/buckets

Click "New bucket" and configure:
- **Name**: `drafts`
- **Public**: NO (keep private)
- **File size limit**: 104857600 (100 MB)
- **Allowed MIME types**: Leave empty

### 3. Apply Storage Policies

After creating the bucket, run this in SQL Editor:

```bash
cat supabase/migrations/003_tutor_onboarding_drafts_storage.sql
```

### 4. Verify Setup

Test the API endpoints:

```bash
# In your browser console (while logged in):
const userId = 'user_3AJ5NfGS73kIkwQGQy4gpYdvarc'; // Your Clerk user ID

// Test fetching drafts
fetch(`/api/drafts/${userId}`)
  .then(r => r.json())
  .then(console.log);

// Test upload (with a file input)
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('fileType', 'profile_photo');
formData.append('clerkUserId', userId);

fetch('/api/drafts/upload', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);
```

## What Was Fixed

### Migration Files Updated

Both migration files now use permissive RLS policies that work with Clerk authentication:

- `003_tutor_onboarding_drafts.sql` - Table policies
- `003_tutor_onboarding_drafts_storage.sql` - Storage policies

The old policies checked `auth.uid()` which only works with Supabase Auth. Since you're using Clerk + service role key, security is enforced at the API layer instead.

## Expected Behavior After Fix

- ✅ No more 403 errors on `/api/drafts/[userId]`
- ✅ No more 400 errors on `/api/drafts/upload`
- ✅ Files upload successfully
- ✅ Draft restoration works on page reload

## Multiple GoTrueClient Warning

This is a minor warning from having multiple Supabase client instances. It won't break functionality but you can fix it by ensuring you only create one client instance. The current setup is fine for development.
