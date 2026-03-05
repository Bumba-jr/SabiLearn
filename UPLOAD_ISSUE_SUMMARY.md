# Upload Issue - Summary & Next Steps

## Problem

Upload endpoint returns 400 errors with empty response bodies. The route handler code never executes (no logs appear in terminal), indicating Next.js is rejecting requests before they reach our handler.

## What I've Done

### 1. Enhanced Debugging

Added comprehensive logging to `app/api/drafts/upload/route.ts`:
- ✅ Logs at the very start of POST handler
- ✅ Logs for auth check
- ✅ Logs for formData parsing with error handling
- ✅ Logs for all form fields
- ✅ Added GET endpoint to test route accessibility

### 2. Route Configuration

Added route segment config to `app/api/drafts/upload/route.ts`:
```typescript
export const runtime = 'nodejs';
export const maxDuration = 60;
```

### 3. Created Test Tools

**Test Page**: `http://localhost:3000/test-upload.html`
- Tests route accessibility (GET request)
- Tests uploads with different file sizes (500 bytes, 1MB, 5MB)
- Tests custom file uploads
- Shows detailed results and logs

**Debug Guide**: `UPLOAD_DEBUG_GUIDE.md`
- Explains the issue in detail
- Provides testing steps
- Outlines solution options
- Includes implementation plan for presigned URLs

## Diagnosis

Based on the symptoms, the most likely cause is:

**Next.js 15 App Router has a hard-coded request body size limit (~4-5MB) that cannot be configured.**

Evidence:
1. Route handler never executes (no "📤 Upload route hit" log)
2. 400 error with empty response body
3. Request shows in Next.js logs but handler code doesn't run
4. Our file limits (5MB for docs, 100MB for videos) exceed Next.js limits

## Next Steps - PLEASE TEST

### Step 1: Test Route Accessibility

Visit: `http://localhost:3000/api/drafts/upload`

Expected: JSON response `{"message": "Upload endpoint is accessible"}`

### Step 2: Use Test Page

Visit: `http://localhost:3000/test-upload.html`

1. Click "Test GET /api/drafts/upload" - should succeed
2. Click "Create & Upload Tiny File" - if this works, confirms body size issue
3. Try progressively larger files to find the limit

### Step 3: Check Terminal

When you click the upload buttons, check your terminal for:
- ✅ "📤 Upload route hit" - means handler is being called
- ❌ No message - means Next.js is rejecting before handler

### Step 4: Report Results

Please share:
1. Which tests passed/failed from the test page
2. What file size you're trying to upload in the actual app
3. Whether you see "📤 Upload route hit" in terminal for any test

## Solution Options

### Option A: Presigned URLs (Recommended)

Instead of uploading through Next.js, upload directly to Supabase Storage:

**Pros:**
- No Next.js body size limits
- Faster (direct to storage)
- Real upload progress
- Works with any file size

**Cons:**
- Requires code changes
- More complex flow

**Implementation:** See `UPLOAD_DEBUG_GUIDE.md` for detailed plan

### Option B: Chunked Uploads

Split files into small chunks and upload separately:

**Pros:**
- Works within Next.js limits
- Can resume failed uploads

**Cons:**
- More complex
- Slower for small files
- Requires server-side reassembly

### Option C: Increase Next.js Limit (If Possible)

Research if Next.js 15 has a way to configure body size limits for App Router.

**Pros:**
- Minimal code changes

**Cons:**
- May not be possible
- Still limited for very large files

## Recommended Path Forward

1. **Confirm diagnosis** with test page
2. **Implement presigned URLs** for production-ready solution
3. **Keep current endpoint** for small files (< 4MB)

## Files Modified

- `app/api/drafts/upload/route.ts` - Added logging and GET endpoint
- `middleware.ts` - Added comment about API route passthrough
- `next.config.ts` - Already has body size config (doesn't work for App Router)
- `hooks/useDraftFileUpload.ts` - Already has good error handling

## Files Created

- `UPLOAD_DEBUG_GUIDE.md` - Detailed debugging guide
- `public/test-upload.html` - Interactive test page
- `UPLOAD_ISSUE_SUMMARY.md` - This file

## What to Do Now

1. **Test**: Visit `http://localhost:3000/test-upload.html`
2. **Report**: Share which tests pass/fail
3. **Decide**: Choose solution based on test results
4. **Implement**: I can help implement presigned URLs if needed

## Questions to Answer

1. What file size are you trying to upload?
2. Does the tiny file test (500 bytes) work?
3. Do you see "📤 Upload route hit" in terminal for any test?
4. Which solution do you prefer (presigned URLs recommended)?
