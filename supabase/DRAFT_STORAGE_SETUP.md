# Draft Storage Setup Guide

This guide explains how to set up the Supabase Storage bucket for tutor onboarding draft files.

## Overview

The draft storage system allows tutors to upload files during the onboarding process. Files are automatically saved to the server and persist across browser sessions. Draft files expire after 30 days if not submitted.

## Prerequisites

- Supabase project created and configured
- Migrations 001 and 002 already applied
- Admin access to Supabase Dashboard

## Step 1: Create the Storage Bucket

1. **Navigate to Storage**
   - Log in to your Supabase Dashboard
   - Go to **Storage** in the left sidebar

2. **Create New Bucket**
   - Click the **"New bucket"** button
   - Configure the bucket with these settings:

   | Setting | Value | Description |
   |---------|-------|-------------|
   | **Name** | `drafts` | Bucket name (must be exactly "drafts") |
   | **Public** | ❌ **NO** | Private bucket requiring authentication |
   | **File size limit** | `104857600` | 100 MB in bytes |
   | **Allowed MIME types** | Leave empty | Validation handled in application code |

3. **Create the Bucket**
   - Click **"Create bucket"**
   - Verify the bucket appears in the Storage list

## Step 2: Apply Storage Policies

1. **Open SQL Editor**
   - Go to **SQL Editor** in the left sidebar
   - Click **"New query"**

2. **Run Migration**
   - Copy the contents of `supabase/migrations/003_tutor_onboarding_drafts_storage.sql`
   - Paste into the SQL editor
   - Click **"Run"** to execute

3. **Verify Policies**
   - Go back to **Storage** → **Policies**
   - Select the `drafts` bucket
   - You should see 4 policies:
     - ✅ Users can upload own draft files
     - ✅ Users can read own draft files
     - ✅ Users can update own draft files
     - ✅ Users can delete own draft files

## Step 3: Verify Setup

### Test Bucket Access

Run this query in the SQL Editor to verify the bucket exists:

```sql
SELECT * FROM storage.buckets WHERE name = 'drafts';
```

Expected result:
- `id`: drafts
- `name`: drafts
- `public`: false
- `file_size_limit`: 104857600

### Test Policies

Run this query to verify policies are active:

```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%draft%';
```

Expected result: 4 policies listed

## File Organization

### Path Structure

Draft files are organized by user and file type:

```
drafts/
├── {clerk_user_id_1}/
│   ├── degree_certificate/
│   │   └── 1704067200000_degree.pdf
│   ├── government_id/
│   │   └── 1704067300000_id_card.jpg
│   ├── nysc_certificate/
│   │   └── 1704067400000_nysc.pdf
│   ├── profile_photo/
│   │   └── 1704067500000_photo.jpg
│   └── intro_video/
│       └── 1704067600000_intro.mp4
├── {clerk_user_id_2}/
│   └── ...
```

### File Types

| File Type | Max Size | Accepted Formats |
|-----------|----------|------------------|
| `degree_certificate` | 5 MB | PDF, JPEG, PNG |
| `government_id` | 5 MB | PDF, JPEG, PNG |
| `nysc_certificate` | 5 MB | PDF, JPEG, PNG |
| `profile_photo` | 5 MB | JPEG, PNG, HEIC, WebP |
| `intro_video` | 100 MB | MP4, WebM, MOV |

### Naming Convention

Files are named using timestamp + sanitized original filename:
```
{timestamp}_{sanitized_filename}

Example:
1704067200000_my_degree_certificate.pdf
```

## Security

### Row Level Security (RLS)

All storage policies enforce user-scoped access:

- **Upload**: Users can only upload to `drafts/{their_clerk_id}/*`
- **Read**: Users can only read files in `drafts/{their_clerk_id}/*`
- **Update**: Users can only update files in `drafts/{their_clerk_id}/*`
- **Delete**: Users can only delete files in `drafts/{their_clerk_id}/*`

### Authentication

- All operations require valid Clerk authentication
- The `auth.uid()` function returns the authenticated user's Clerk ID
- Unauthenticated requests are automatically rejected

### Private Bucket

- The bucket is **private** (not public)
- Files cannot be accessed via direct URLs
- Access requires signed URLs with 1-hour expiration
- Signed URLs are generated server-side with authentication checks

## Lifecycle Management

### Draft Expiration

- Draft files expire **30 days** after upload
- Expiration is tracked in the `tutor_onboarding_drafts` table
- A scheduled cleanup job runs daily at 2:00 AM UTC
- Expired files are automatically deleted from storage

### Form Submission

When a tutor completes onboarding:
1. Draft files are moved to permanent storage
2. The `tutors` table is updated with permanent URLs
3. Draft metadata records are deleted
4. localStorage references are cleared

### Manual Cleanup

To manually trigger cleanup (admin only):

```bash
curl -X POST https://your-app.vercel.app/api/drafts/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

## Monitoring

### Storage Usage

Check total storage used by drafts:

```sql
SELECT 
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint as total_bytes,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'drafts';
```

### Files by User

Check draft files for a specific user:

```sql
SELECT 
  name,
  metadata->>'size' as size_bytes,
  created_at
FROM storage.objects
WHERE bucket_id = 'drafts'
AND (storage.foldername(name))[1] = 'user_clerk_id_here'
ORDER BY created_at DESC;
```

### Expired Drafts

Check how many drafts are expired:

```sql
SELECT COUNT(*) as expired_count
FROM tutor_onboarding_drafts
WHERE expires_at < NOW();
```

## Troubleshooting

### Issue: Policies not working

**Symptom**: Users get "permission denied" errors when uploading

**Solution**:
1. Verify RLS is enabled on `storage.objects`
2. Check policies exist: `SELECT * FROM pg_policies WHERE tablename = 'objects'`
3. Ensure Clerk authentication is working: `SELECT auth.uid()`
4. Verify bucket is private (public buckets bypass RLS)

### Issue: File size limit exceeded

**Symptom**: Uploads fail with "file too large" error

**Solution**:
1. Check bucket file size limit: `SELECT file_size_limit FROM storage.buckets WHERE name = 'drafts'`
2. Should be 104857600 (100 MB)
3. Update if needed: `UPDATE storage.buckets SET file_size_limit = 104857600 WHERE name = 'drafts'`

### Issue: Files not being deleted

**Symptom**: Expired files remain in storage

**Solution**:
1. Check cleanup job is running: Review Vercel cron logs
2. Verify expired drafts exist: `SELECT * FROM tutor_onboarding_drafts WHERE expires_at < NOW()`
3. Manually trigger cleanup: `POST /api/drafts/cleanup`
4. Check for storage deletion errors in application logs

### Issue: Cannot access files

**Symptom**: Signed URLs return 403 errors

**Solution**:
1. Verify signed URL hasn't expired (1-hour limit)
2. Check user authentication is valid
3. Verify file exists: Query `storage.objects` table
4. Ensure user owns the file (clerk_user_id matches)

## Next Steps

After completing this setup:

1. ✅ Bucket created and configured
2. ✅ Storage policies applied
3. ⏭️ Continue to Task 1.1: Create database migration for `tutor_onboarding_drafts` table
4. ⏭️ Implement API endpoints for draft management
5. ⏭️ Integrate draft storage into tutor onboarding form

## Support

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Project Spec](.kiro/specs/tutor-onboarding-draft-storage/)
