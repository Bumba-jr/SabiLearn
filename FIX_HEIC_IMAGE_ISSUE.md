# HEIC Image Display Issue

## Problem

The image at this URL fails to load in the browser:
```
https://vgmflkoykskpqxryrdsp.supabase.co/storage/v1/object/public/drafts/07007f0b-f51f-4ba8-8997-9cfd24447c95/profile_photo/1773089741300_IMG_2076.heic
```

Error: `Image failed to load`

## Root Cause

The file is in **HEIC format** (Apple's High Efficiency Image Container), which:
- ✅ Is accepted during upload (validation allows it)
- ✅ Is stored successfully in Supabase
- ❌ **Cannot be displayed in web browsers** (no native browser support)

HEIC is Apple's proprietary format used by iPhones. While the file validation accepts it, browsers (Chrome, Firefox, Safari on web) cannot render HEIC images directly.

## Solutions

### Option 1: Convert HEIC to JPEG on Upload (Recommended)

Convert HEIC files to JPEG on the server side before storing them. This requires:

1. Install a HEIC conversion library:
   ```bash
   npm install heic-convert
   ```

2. Update the upload route to detect and convert HEIC files
3. Store the converted JPEG instead of the original HEIC

**Pros:**
- Works for all users automatically
- No client-side changes needed
- Better browser compatibility

**Cons:**
- Requires server-side processing
- Slightly larger file sizes (JPEG vs HEIC)
- Additional dependency

### Option 2: Client-Side Conversion (Alternative)

Convert HEIC to JPEG in the browser before upload:

1. Install browser-image-compression or heic2any:
   ```bash
   npm install heic2any
   ```

2. Update the onboarding form to convert HEIC files before upload

**Pros:**
- No server processing needed
- User sees conversion happening

**Cons:**
- Requires client-side JavaScript
- May not work in all browsers
- Slower for users

### Option 3: Reject HEIC Files (Quick Fix)

Simply don't accept HEIC files and ask users to convert them first.

**Pros:**
- No code changes needed
- Simple solution

**Cons:**
- Poor user experience
- Many iPhone users will be affected

## Recommended Implementation

I recommend **Option 1** (server-side conversion) for the best user experience.

## Temporary Workaround

For now, you can:

1. **Ask the user to re-upload** using a different format:
   - On iPhone: Go to Settings → Camera → Formats → Choose "Most Compatible" (saves as JPEG)
   - Or use a photo editing app to export as JPEG

2. **Or manually convert the file**:
   - Download the HEIC file from Supabase Storage
   - Convert it to JPEG using an online tool or Preview app (Mac)
   - Re-upload the JPEG version

## Next Steps

Would you like me to:
1. Implement server-side HEIC to JPEG conversion?
2. Implement client-side conversion before upload?
3. Update validation to reject HEIC files with a helpful error message?

Let me know which approach you prefer!
