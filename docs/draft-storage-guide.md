# Draft Storage Developer Guide

## Overview

The Draft Storage feature enables automatic server-side storage of uploaded files during the tutor onboarding process. This allows tutors to complete their application across multiple sessions without losing their file uploads.

## Architecture

### Components

1. **Database Layer** (`lib/db/draft-operations.ts`)
   - CRUD operations for draft metadata
   - PostgreSQL storage via Supabase

2. **Storage Layer** (`lib/storage/draft-storage.ts`)
   - File upload/download/delete operations
   - Supabase Storage integration
   - Signed URL generation

3. **API Layer** (`app/api/drafts/`)
   - RESTful endpoints for draft management
   - Authentication and authorization
   - Error handling and validation

4. **Frontend Layer**
   - `useDraftFileUpload` hook: File upload with progress tracking
   - `DraftFileInput` component: Drag-and-drop file input with draft restoration
   - Draft restoration utilities: localStorage synchronization

### Data Flow

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ 1. Upload file
       ▼
┌─────────────────┐
│  API Endpoint   │
│  /api/drafts/   │
│     upload      │
└────────┬────────┘
         │
         │ 2. Validate file
         ▼
┌─────────────────┐
│ File Validation │
│     Utility     │
└────────┬────────┘
         │
         │ 3. Generate path
         ▼
┌─────────────────┐
│  Storage Path   │
│     Utility     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         │ 4a. Upload      │ 4b. Create
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│    Supabase     │ │   PostgreSQL    │
│     Storage     │ │    (Metadata)   │
└─────────────────┘ └─────────────────┘
```

## File Upload Flow

### 1. Client-Side Upload

```typescript
import { useDraftFileUpload } from '@/hooks/useDraftFileUpload';

function MyComponent() {
  const { upload, isUploading, progress, error } = useDraftFileUpload({
    fileType: 'degree_certificate',
    onSuccess: (draftId, filename) => {
      console.log('Upload successful:', draftId, filename);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const handleFileSelect = async (file: File) => {
    await upload(file, clerkUserId);
  };

  return (
    <div>
      {isUploading && <div>Progress: {progress}%</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### 2. Server-Side Processing

```typescript
// API endpoint handles:
// 1. Authentication check
// 2. File validation
// 3. Storage path generation
// 4. File upload to Supabase Storage
// 5. Metadata creation in PostgreSQL
// 6. Transaction rollback on failure
```

### 3. Draft Metadata Storage

```typescript
// Metadata stored in PostgreSQL:
{
  id: 'uuid',
  clerk_user_id: 'user_xxx',
  file_type: 'degree_certificate',
  storage_path: 'drafts/user_xxx/degree_certificate/1234567890_file.pdf',
  original_filename: 'file.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf',
  uploaded_at: '2024-01-01T00:00:00Z',
  expires_at: '2024-01-31T00:00:00Z' // 30 days from upload
}
```

## Draft Restoration Flow

### 1. Load Drafts on Page Mount

```typescript
import { validateDraftsWithServer } from '@/lib/utils/draft-restoration';

useEffect(() => {
  async function loadDrafts() {
    // Validate localStorage references with server
    const validatedDrafts = await validateDraftsWithServer(userId);
    
    // Update component state
    setDraftMetadata(validatedDrafts);
  }
  
  loadDrafts();
}, [userId]);
```

### 2. Display Draft Restoration UI

```typescript
<DraftFileInput
  fileType="degree_certificate"
  draftMetadata={draftMetadata.degree_certificate}
  onDraftRestore={async (metadata) => {
    // Fetch signed URL
    const response = await fetch(`/api/drafts/download/${metadata.id}`);
    const { signedUrl } = await response.json();
    
    // Download file
    const fileResponse = await fetch(signedUrl);
    const blob = await fileResponse.blob();
    const file = new File([blob], metadata.original_filename, {
      type: metadata.mime_type
    });
    
    // Update form state
    setFormData({ ...formData, degreeCertificate: file });
  }}
/>
```

### 3. Clear Drafts After Submission

```typescript
import { clearAllDraftReferences } from '@/lib/utils/draft-restoration';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Submit form
    await submitOnboardingForm(formData);
    
    // Clear draft references
    clearAllDraftReferences();
    
    // Redirect to success page
    router.push('/dashboard');
  } catch (error) {
    console.error('Submission failed:', error);
  }
};
```

## Cleanup Job

### Automatic Cleanup

Expired drafts (older than 30 days) are automatically deleted daily at 2:00 AM UTC via Vercel Cron.

**Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/drafts/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Manual Cleanup

You can manually trigger the cleanup job:

```bash
curl -X POST https://your-domain.com/api/drafts/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

### Cleanup Process

1. Query all drafts where `expires_at < NOW()`
2. For each expired draft:
   - Delete file from Supabase Storage
   - Delete metadata from PostgreSQL
   - Log deletion with reason: 'expiration'
3. Continue processing on individual failures
4. Return summary: `{ deletedCount, errorCount, executionTimeMs }`

## Error Handling

### Client-Side

```typescript
const { upload, error, clearError } = useDraftFileUpload({
  fileType: 'degree_certificate',
  onError: (error) => {
    // Display error to user
    toast.error(error);
  },
});

// Retry upload
const handleRetry = () => {
  clearError();
  upload(file, userId);
};
```

### Server-Side

```typescript
try {
  // Upload file
  await uploadDraftFile(file, storagePath);
  
  // Create metadata
  await createDraftMetadata({ ... });
} catch (error) {
  // Rollback: delete uploaded file
  try {
    await deleteDraftFile(storagePath);
  } catch (cleanupError) {
    console.error('Failed to cleanup:', cleanupError);
  }
  
  throw error;
}
```

### Logging

```typescript
import { logUpload, logDeletion, logCleanupJob } from '@/lib/utils/error-logger';

// Log upload
logUpload(userId, fileType, filename, fileSize, success, error);

// Log deletion
logDeletion(userId, fileType, 'user_replaced', success, error);

// Log cleanup job
logCleanupJob(startTime, endTime, deletedCount, errorCount, error);
```

## Security Considerations

### 1. Authentication

All API endpoints verify Clerk authentication:

```typescript
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Authorization

Users can only access their own drafts:

```typescript
if (clerkUserId !== userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 3. File Validation

Files are validated for:
- File type (degree_certificate, government_id, etc.)
- File size (5MB for documents, 100MB for videos)
- MIME type (PDF, JPG, PNG, MP4, etc.)
- Executable files are rejected (.exe, .sh, .bat, .js, .py)

### 4. Storage Security

- Files are stored in a private Supabase Storage bucket
- Row Level Security (RLS) policies ensure users can only access their own files
- Signed URLs expire after 1 hour

### 5. Admin API Key

The cleanup cron job requires an admin API key:

```typescript
const authHeader = request.headers.get('authorization');
const adminApiKey = process.env.ADMIN_API_KEY;

if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test lib/db/draft-operations.test.ts

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```typescript
// Test complete upload flow
describe('Draft Upload Flow', () => {
  it('should upload file and create metadata', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', 'degree_certificate');
    formData.append('clerkUserId', 'user_123');

    const response = await fetch('/api/drafts/upload', {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.draft).toBeDefined();
  });
});
```

## Performance Optimization

### 1. File Upload

- Use multipart upload for large files
- Show progress indicator to users
- Implement retry logic for failed uploads

### 2. Draft Restoration

- Load drafts asynchronously on page mount
- Cache draft metadata in component state
- Use signed URLs with 1-hour expiration

### 3. Cleanup Job

- Process drafts in batches
- Continue on individual failures
- Log execution time and results

## Common Use Cases

### 1. Replace Existing Draft

When a user uploads a new file for the same file type:

```typescript
// Check if draft exists
const existingDraft = drafts.find(d => d.file_type === fileType);

if (existingDraft) {
  // Upload new file
  await uploadDraftFile(file, newStoragePath);
  
  // Update metadata
  await updateDraftMetadata(existingDraft.id, userId, { ... });
  
  // Delete old file
  await deleteDraftFile(existingDraft.storage_path);
}
```

### 2. Restore Draft on Page Load

```typescript
useEffect(() => {
  async function restoreDrafts() {
    const drafts = await validateDraftsWithServer(userId);
    
    for (const [fileType, metadata] of Object.entries(drafts)) {
      // Fetch file
      const response = await fetch(`/api/drafts/download/${metadata.id}`);
      const { signedUrl } = await response.json();
      
      // Download and restore
      const fileResponse = await fetch(signedUrl);
      const blob = await fileResponse.blob();
      const file = new File([blob], metadata.original_filename, {
        type: metadata.mime_type
      });
      
      // Update form
      updateFormField(fileType, file);
    }
  }
  
  restoreDrafts();
}, [userId]);
```

### 3. Manual Draft Deletion

```typescript
const handleDeleteDraft = async (fileType: FileType) => {
  const response = await fetch(`/api/drafts/${userId}/${fileType}`, {
    method: 'DELETE',
  });
  
  if (response.ok) {
    // Update UI
    setDraftMetadata(prev => ({ ...prev, [fileType]: null }));
    setFormData(prev => ({ ...prev, [fileType]: null }));
  }
};
```

## Troubleshooting

### Issue: Drafts not loading

**Solution:**
1. Check browser console for errors
2. Verify Clerk authentication is working
3. Check API endpoint responses
4. Verify Supabase connection

### Issue: File upload fails

**Solution:**
1. Check file size limits
2. Verify file type is supported
3. Check Supabase Storage bucket permissions
4. Review server logs for errors

### Issue: Cleanup job not running

**Solution:**
1. Verify Vercel Cron is configured correctly
2. Check ADMIN_API_KEY environment variable
3. Review Vercel deployment logs
4. Test cleanup endpoint manually

## Additional Resources

- [API Documentation](./api/draft-storage.md)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Clerk Authentication Documentation](https://clerk.com/docs)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
