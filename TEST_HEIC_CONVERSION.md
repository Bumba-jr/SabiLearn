# Test HEIC Conversion

## Quick Test Steps

### 1. Restart Development Server

The new package needs to be loaded:

```bash
# Stop current server (Ctrl+C or Cmd+C)
# Then restart:
npm run dev
```

### 2. Test HEIC Upload

1. Go to `http://localhost:3000/onboarding/tutor`
2. Navigate to the Profile Media section
3. Upload a HEIC photo (from iPhone)
4. Watch the browser console for conversion logs:

Expected logs:
```
🔍 HEIC file detected, converting to JPEG...
🔄 Converting HEIC to JPEG: IMG_2076.heic
📦 Input buffer size: 2458392 bytes
✅ Conversion successful. Output size: 1847293 bytes
📸 Created JPEG file: IMG_2076.jpg
✅ HEIC file converted to JPEG
⬆️ Uploading new file...
✅ File uploaded successfully
```

### 3. Verify Storage

1. Go to Supabase Dashboard → Storage → drafts bucket
2. Navigate to your user folder → profile_photo
3. File should be saved as `.jpg` (not `.heic`)

### 4. Verify Display

1. Complete onboarding
2. Go to `http://localhost:3000/find-tutors`
3. Your profile photo should display correctly ✅

## Test with Regular JPEG

1. Upload a regular JPEG file
2. Should see: `✅ File is not HEIC, no conversion needed`
3. File uploaded without conversion overhead

## Expected Behavior

- ✅ HEIC files automatically converted to JPEG
- ✅ JPEG files uploaded as-is (no conversion)
- ✅ PNG, WebP, GIF files uploaded as-is
- ✅ Converted files display in all browsers
- ✅ Original filename preserved (with .jpg extension)

## Troubleshooting

### If conversion fails:

1. Check console for error messages
2. Verify `heic-convert` package is installed:
   ```bash
   pnpm list heic-convert
   ```
3. Try a different HEIC file
4. Check file size (must be under 5MB)

### If image still doesn't display:

1. Check the file URL in browser console
2. Verify it ends with `.jpg` (not `.heic`)
3. Try opening the URL directly in browser
4. Check Supabase Storage permissions

## Success Criteria

✅ HEIC files convert automatically
✅ Conversion completes in 1-2 seconds
✅ Converted JPEG displays in browser
✅ File size is reasonable (similar to original)
✅ No errors in console
✅ User experience is seamless

Ready to test!
