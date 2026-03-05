# Upload Endpoint Debugging Guide

## Current Issue

The upload endpoint returns 400 errors with empty response bodies, and the route handler logs never appear in the terminal. This indicates the request is being rejected by Next.js BEFORE reaching our route handler code.

## Evidence

1. Terminal shows: `POST /api/drafts/upload 400 in 155ms`
2. NO "📤 Upload route hit" message appears (first line of our handler)
3. Browser receives empty JSON response: `{}`
4. Request timing shows: `(compile: 95ms, proxy.ts: 41ms, render: 19ms)`

## Root Cause

Next.js 15 App Router has a **hard-coded request body size limit** (approximately 4-5MB) that cannot be configured through `next.config.ts`. When a request exceeds this limit, Next.js rejects it at the framework level before calling the route handler.

Our file validation allows:
- Documents/Images: 5MB
- Videos: 100MB

This means ANY file upload will likely hit the limit.

## Testing Steps

### Step 1: Test Route Accessibility

Visit in browser: `http://localhost:3000/api/drafts/upload`

Expected: JSON response `{"message": "Upload endpoint is accessible"}`

If this works, the route file is correctly configured.

### Step 2: Test with Tiny File

Try uploading a very small file (< 1KB):
1. Create a tiny text file or small image
2. Try uploading it through the onboarding form
3. Check terminal for "📤 Upload route hit" message

If this works, confirms the issue is body size limit.

### Step 3: Check File Size

In browser console, before upload, log:
```javascript
console.log('File size:', file.size, 'bytes', (file.size / 1024 / 1024).toFixed(2), 'MB');
```

## Solutions

### Option 1: Use Presigned URLs (Recommended)

Instead of uploading through Next.js, generate presigned URLs and upload directly to Supabase Storage:

1. Client requests presigned URL from API
2. Client uploads file directly to Supabase using presigned URL
3. Client notifies API that upload is complete
4. API creates metadata record

Benefits:
- No Next.js body size limits
- Faster uploads (direct to storage)
- Better for large files
- Can show real upload progress

### Option 2: Chunked Uploads

Split large files into chunks and upload them separately:

1. Client splits file into 2MB chunks
2. Upload each chunk separately
3. Server reassembles chunks
4. Create metadata record

Benefits:
- Works within Next.js limits
- Can resume failed uploads
- Better error handling

Drawbacks:
- More complex implementation
- Slower for small files

### Option 3: External Upload Service

Use a service like Uploadthing or Cloudinary that handles large file uploads.

## Recommended Next Steps

1. **Confirm the diagnosis**: Test with a tiny file (< 1KB)
2. **Implement presigned URLs**: This is the cleanest solution for Supabase Storage
3. **Update client code**: Use direct upload to storage instead of API route

## Implementation Plan for Presigned URLs

### 1. Create Presigned URL Endpoint

```typescript
// app/api/drafts/presigned-url/route.ts
export async function POST(request: NextRequest) {
  const { fileType, fileName, fileSize } = await request.json();
  
  // Validate request
  // Generate storage path
  // Create presigned URL from Supabase
  // Return URL to client
}
```

### 2. Update Upload Hook

```typescript
// hooks/useDraftFileUpload.ts
async function upload(file: File, clerkUserId: string) {
  // 1. Request presigned URL
  const { url, storagePath } = await fetch('/api/drafts/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ fileType, fileName: file.name, fileSize: file.size })
  }).then(r => r.json());
  
  // 2. Upload directly to Supabase
  await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  // 3. Create metadata record
  await fetch('/api/drafts/metadata', {
    method: 'POST',
    body: JSON.stringify({ storagePath, fileType, ... })
  });
}
```

### 3. Benefits

- No Next.js body size limits
- Real upload progress tracking
- Direct upload to storage (faster)
- Works with files of any size
- Cleaner separation of concerns

## Current Status

- ✅ Added GET endpoint to test route accessibility
- ✅ Added extensive logging to POST handler
- ✅ Configured route segment options
- ⏳ Waiting for test results to confirm diagnosis
- ⏳ Ready to implement presigned URL solution

## Next Action

Please test with a very small file (< 1KB) and check if:
1. The GET endpoint works: `http://localhost:3000/api/drafts/upload`
2. A tiny file upload shows "📤 Upload route hit" in terminal
3. What file size are you trying to upload?
