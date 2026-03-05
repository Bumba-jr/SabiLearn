# Draft Storage API Documentation

## Overview

The Draft Storage API provides endpoints for managing temporary file uploads during the tutor onboarding process. Files are automatically saved to Supabase Storage and metadata is stored in PostgreSQL, allowing tutors to complete their application across multiple sessions.

## Base URL

```
/api/drafts
```

## Authentication

All endpoints require Clerk authentication. Include the Clerk session token in your requests.

## Endpoints

### 1. Upload Draft File

Uploads a file and creates/updates draft metadata.

**Endpoint:** `POST /api/drafts/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (File, required): The file to upload
- `fileType` (string, required): One of: `degree_certificate`, `government_id`, `nysc_certificate`, `profile_photo`, `intro_video`
- `clerkUserId` (string, required): The Clerk user ID

**Response:**

```json
{
  "message": "Draft created successfully",
  "draft": {
    "id": "uuid",
    "clerk_user_id": "user_xxx",
    "file_type": "degree_certificate",
    "storage_path": "drafts/user_xxx/degree_certificate/1234567890_file.pdf",
    "original_filename": "file.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "uploaded_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-01-31T00:00:00Z"
  }
}
```

**Status Codes:**
- `201`: Draft created/updated successfully
- `400`: Validation error (missing fields, invalid file type, file too large)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (user ID mismatch)
- `500`: Server error

**File Validation Rules:**
- Documents (degree_certificate, government_id, nysc_certificate): Max 5MB, PDF/JPG/PNG
- Photos (profile_photo): Max 5MB, JPG/PNG/HEIC
- Videos (intro_video): Max 100MB, MP4/WEBM/MOV

**Example:**

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('fileType', 'degree_certificate');
formData.append('clerkUserId', userId);

const response = await fetch('/api/drafts/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

---

### 2. Get User Drafts

Retrieves all draft metadata for a user.

**Endpoint:** `GET /api/drafts/[clerkUserId]`

**Parameters:**
- `clerkUserId` (path, required): The Clerk user ID

**Response:**

```json
{
  "drafts": [
    {
      "id": "uuid",
      "clerk_user_id": "user_xxx",
      "file_type": "degree_certificate",
      "storage_path": "drafts/user_xxx/degree_certificate/1234567890_file.pdf",
      "original_filename": "file.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "uploaded_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-01-31T00:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success (returns empty array if no drafts)
- `401`: Unauthorized
- `403`: Forbidden (user ID mismatch)
- `500`: Server error

**Example:**

```typescript
const response = await fetch(`/api/drafts/${userId}`);
const { drafts } = await response.json();
```

---

### 3. Delete Draft

Deletes a draft file and its metadata.

**Endpoint:** `DELETE /api/drafts/[clerkUserId]/[fileType]`

**Parameters:**
- `clerkUserId` (path, required): The Clerk user ID
- `fileType` (path, required): The file type to delete

**Response:**

```json
{
  "message": "Draft deleted successfully"
}
```

**Status Codes:**
- `200`: Draft deleted successfully
- `401`: Unauthorized
- `403`: Forbidden (user ID mismatch)
- `404`: Draft not found
- `500`: Server error

**Example:**

```typescript
const response = await fetch(`/api/drafts/${userId}/degree_certificate`, {
  method: 'DELETE',
});
```

---

### 4. Get Download URL

Generates a signed URL for downloading a draft file.

**Endpoint:** `GET /api/drafts/download/[draftId]`

**Parameters:**
- `draftId` (path, required): The draft ID

**Response:**

```json
{
  "signedUrl": "https://storage.supabase.co/...",
  "expiresIn": 3600
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Draft not found or access denied
- `500`: Server error

**Example:**

```typescript
const response = await fetch(`/api/drafts/download/${draftId}`);
const { signedUrl, expiresIn } = await response.json();

// Use the signed URL to download the file
const fileResponse = await fetch(signedUrl);
const blob = await fileResponse.blob();
```

---

### 5. Cleanup Expired Drafts (Cron Job)

Deletes expired drafts (older than 30 days).

**Endpoint:** `POST /api/drafts/cleanup`

**Headers:**
- `Authorization: Bearer <ADMIN_API_KEY>` (required)

**Response:**

```json
{
  "deletedCount": 5,
  "errorCount": 0,
  "executionTimeMs": 1234
}
```

**Status Codes:**
- `200`: Cleanup completed
- `401`: Unauthorized (invalid API key)
- `500`: Server error

**Note:** This endpoint is called automatically by Vercel Cron daily at 2:00 AM UTC.

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## Rate Limiting

No rate limiting is currently implemented, but consider adding it for production use.

## Best Practices

1. **File Validation**: Always validate files on the client side before uploading
2. **Error Handling**: Handle all possible error responses gracefully
3. **Progress Tracking**: Show upload progress to users
4. **Cleanup**: Clear localStorage references after successful form submission
5. **Security**: Never expose the ADMIN_API_KEY to clients

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Admin API Key (for cleanup cron job)
ADMIN_API_KEY=your_secure_random_key
```

## Storage Structure

Files are stored in Supabase Storage with the following path structure:

```
drafts/
  └── {clerk_user_id}/
      └── {file_type}/
          └── {timestamp}_{sanitized_filename}
```

Example:
```
drafts/user_2abc123/degree_certificate/1704067200000_my_degree.pdf
```

## Database Schema

The `tutor_onboarding_drafts` table stores metadata:

```sql
CREATE TABLE tutor_onboarding_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN (
    'degree_certificate',
    'government_id',
    'nysc_certificate',
    'profile_photo',
    'intro_video'
  )),
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(clerk_user_id, file_type)
);
```

## Support

For issues or questions, contact the development team or create an issue in the repository.
