# Convert Existing HEIC Images - Complete Guide

## Problem

You have existing HEIC images already uploaded to storage that browsers can't display. These need to be converted to JPEG.

## Solution

I've created an automated migration script that will:
1. Find all tutors with HEIC images in the database
2. Download each HEIC file from storage
3. Convert to JPEG (90% quality)
4. Upload the JPEG to storage
5. Update the database with the new URL
6. Delete the old HEIC file

## Prerequisites

✅ Already installed:
- `heic-convert` - For HEIC to JPEG conversion
- `tsx` - TypeScript execution
- `dotenv` - Environment variable loading
- `@types/node` - Node.js type definitions

## How to Run

### Step 1: Make Sure Dev Server is Running

The script needs access to your conversion utilities:

```bash
# In one terminal, keep dev server running:
npm run dev
```

### Step 2: Run the Conversion Script

In a new terminal:

```bash
npx tsx scripts/convert-existing-heic.ts
```

## What the Script Does

### 1. Discovery Phase
```
🔍 Searching for tutors with HEIC images...
📊 Found 1 tutor(s) with HEIC images:
1. Your Name (07007f0b-f51f-4ba8-8997-9cfd24447c95)
```

### 2. Conversion Phase (for each image)
```
============================================================
📸 Processing: Your Name
   User ID: 07007f0b-f51f-4ba8-8997-9cfd24447c95
   Current URL: https://.../.../IMG_2076.heic
============================================================

📥 Downloading HEIC file...
✅ Downloaded HEIC file (2458392 bytes)
🔄 Converting HEIC to JPEG...
✅ Converted to JPEG (1847293 bytes)
📁 Old path: 07007f0b-.../profile_photo/1773089741300_IMG_2076.heic
📁 New path: 07007f0b-.../profile_photo/1773089741300_IMG_2076.jpg
⬆️  Uploading JPEG to storage...
✅ JPEG uploaded successfully
🔗 New URL: https://.../.../IMG_2076.jpg
💾 Updating database...
✅ Database updated
🗑️  Deleting old HEIC file...
✅ Old HEIC file deleted

✅ SUCCESS: Your Name's image converted!
```

### 3. Summary
```
============================================================
📊 CONVERSION SUMMARY
============================================================
Total images: 1
✅ Successfully converted: 1
❌ Failed: 0
============================================================

🎉 All HEIC images have been converted to JPEG!
```

## Expected Results

After running the script:

1. **Storage**: HEIC files replaced with JPEG files
2. **Database**: `avatar_url` updated to point to `.jpg` files
3. **Display**: Images now display correctly in all browsers
4. **Cleanup**: Old HEIC files removed from storage

## Verification

### Check Database
```sql
-- Run in Supabase SQL Editor
SELECT 
    name,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE '%.jpg%' THEN '✅ JPEG'
        WHEN avatar_url LIKE '%.jpeg%' THEN '✅ JPEG'
        WHEN avatar_url LIKE '%.png%' THEN '✅ PNG'
        WHEN avatar_url LIKE '%.heic%' THEN '❌ HEIC (needs conversion)'
        ELSE '❓ Unknown'
    END as image_format
FROM tutors
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC;
```

### Check Storage
1. Go to Supabase Dashboard → Storage → drafts bucket
2. Navigate to your user folder → profile_photo
3. Should see `.jpg` files (no `.heic` files)

### Check Display
1. Go to `http://localhost:3000/find-tutors`
2. All tutor images should display correctly
3. No console errors about failed image loads

## Troubleshooting

### Script Fails to Find Images

**Issue**: "No HEIC images found"

**Solution**: Check if images are actually HEIC:
```sql
SELECT name, avatar_url 
FROM tutors 
WHERE avatar_url LIKE '%.heic%' OR avatar_url LIKE '%.heif%';
```

### Download Fails

**Issue**: "Failed to download file"

**Possible causes**:
- Storage bucket is not public
- URL is incorrect
- Network issue

**Solution**: Verify bucket is public:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'drafts';
-- public column should be true
```

### Conversion Fails

**Issue**: "Failed to convert HEIC image"

**Possible causes**:
- Corrupted HEIC file
- Unsupported HEIC variant
- Memory issue

**Solution**: Try converting manually or re-upload the image

### Upload Fails

**Issue**: "Upload failed"

**Possible causes**:
- Insufficient permissions
- Storage quota exceeded
- Network issue

**Solution**: Check Supabase service role key in `.env.local`

### Database Update Fails

**Issue**: "Database update failed"

**Possible causes**:
- Row-level security policies
- Invalid tutor ID
- Connection issue

**Solution**: Verify service role key has admin access

## Manual Conversion (Alternative)

If the script fails, you can manually convert:

### Option 1: Re-upload via Onboarding
1. User goes to onboarding page
2. Uploads the same photo again
3. New system automatically converts to JPEG
4. Old HEIC file is replaced

### Option 2: Manual File Conversion
1. Download HEIC from Supabase Storage
2. Convert using:
   - **Mac**: Preview → Export → JPEG
   - **Windows**: Photos → Save As → JPEG
   - **Online**: cloudconvert.com
3. Upload JPEG to storage
4. Update database:
   ```sql
   UPDATE tutors
   SET avatar_url = 'https://...new-jpeg-url...'
   WHERE auth_user_id = 'user-id-here';
   ```

## Safety Features

The script includes:
- ✅ Error handling for each step
- ✅ Detailed logging
- ✅ Rollback on failure (doesn't delete old file if conversion fails)
- ✅ Summary report
- ✅ Non-destructive (creates new file before deleting old)

## Performance

- **Speed**: ~2-3 seconds per image
- **Memory**: Efficient buffer-based processing
- **Network**: Downloads and uploads in sequence
- **Database**: Single update per image

## After Running

Once all HEIC images are converted:
1. ✅ All images display in browsers
2. ✅ No more HEIC files in storage
3. ✅ Database URLs point to JPEG files
4. ✅ Future uploads automatically convert

## Summary

Run this command to convert all existing HEIC images:

```bash
npx tsx scripts/convert-existing-heic.ts
```

The script handles everything automatically and provides detailed progress updates!
