# Design Document: Tutor Onboarding Draft Storage

## Overview

This design document specifies the implementation of server-side draft file storage for the tutor onboarding form. The system enables automatic upload and persistence of file attachments (Degree Certificate, Government ID, Profile Photo, Intro Video, NYSC Certificate) to Supabase Storage, allowing tutors to complete the onboarding process across multiple sessions without losing their uploaded files.

### Problem Statement

Currently, the tutor onboarding form at `app/onboarding/tutor/page.tsx` saves text data to localStorage but cannot persist uploaded files due to browser storage limitations. When users refresh the page or return later, all uploaded files are lost, forcing them to re-upload documents and creating a poor user experience.

### Solution Summary

Implement a draft storage system that:
- Automatically uploads files to Supabase Storage immediately upon selection
- Stores metadata in a PostgreSQL table for tracking and retrieval
- Restores previously uploaded files when users return to the form
- Cleans up expired drafts after 30 days
- Moves draft files to permanent storage upon successful form submission
- Provides secure, user-scoped access to draft files

### Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Clerk Auth
- **Backend**: Next.js API Routes, Supabase PostgreSQL, Supabase Storage
- **Authentication**: Clerk (provides `clerk_user_id`)
- **Storage**: Supabase Storage (S3-compatible object storage)
- **Database**: Supabase PostgreSQL with Row Level Security

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Tutor Onboarding Form                       │
│                  (app/onboarding/tutor/page.tsx)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ File Selection Event
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   useDraftFileUpload Hook                       │
│  - Handles file upload logic                                    │
│  - Manages upload state (progress, errors)                      │
│  - Integrates with localStorage                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP POST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Route: /api/drafts/upload                      │
│  - Validates file type and size                                 │
│  - Generates unique storage path                                │
│  - Uploads to Supabase Storage                                  │
│  - Creates metadata record                                      │
└────────────┬───────────────────────────┬────────────────────────┘
             │                           │
             │                           │
             ▼                           ▼
┌──────────────────────┐       ┌──────────────────────────────┐
│  Supabase Storage    │       │  PostgreSQL Database         │
│  Bucket: drafts      │       │  Table: tutor_onboarding_    │
│                      │       │         drafts               │
│  Path Structure:     │       │                              │
│  drafts/             │       │  Stores:                     │
│    {clerk_id}/       │       │  - draft_id                  │
│      {file_type}/    │       │  - clerk_user_id             │
│        {timestamp}_  │       │  - file_type                 │
│        {filename}    │       │  - storage_path              │
│                      │       │  - original_filename         │
└──────────────────────┘       │  - file_size                 │
                               │  - mime_type                 │
                               │  - uploaded_at               │
                               │  - expires_at                │
                               └──────────────────────────────┘
```

### Component Interaction Flow

#### 1. File Upload Flow

```
User selects file
       │
       ▼
useDraftFileUpload hook triggered
       │
       ├─► Show upload progress indicator
       │
       ▼
POST /api/drafts/upload
       │
       ├─► Validate file (type, size)
       │
       ├─► Generate storage path
       │   drafts/{clerk_id}/{file_type}/{timestamp}_{filename}
       │
       ├─► Upload to Supabase Storage
       │
       ├─► Create metadata record in DB
       │   - Set expires_at = now() + 30 days
       │
       ├─► Return draft metadata
       │
       ▼
Update form state
       │
       ├─► Store draft reference in localStorage
       │   { draftId, filename, uploadedAt, fileType }
       │
       └─► Show success indicator
```

#### 2. Draft Restoration Flow

```
User loads onboarding form
       │
       ▼
Check localStorage for draft references
       │
       ├─► If found: Validate with server
       │
       ▼
GET /api/drafts/{clerkUserId}
       │
       ├─► Query tutor_onboarding_drafts table
       │
       ├─► Return list of draft metadata
       │
       ▼
For each draft:
       │
       ├─► Generate signed URL (1-hour expiry)
       │
       ├─► Update form state with file references
       │
       └─► Display file previews/names
```

#### 3. Form Submission Flow

```
User submits onboarding form
       │
       ▼
POST /api/onboarding/tutor
       │
       ├─► Validate all form data
       │
       ├─► Begin transaction
       │
       ├─► For each draft file:
       │   │
       │   ├─► Copy from drafts/ to permanent location
       │   │   drafts/{clerk_id}/{file_type}/{file}
       │   │   → tutors/{clerk_id}/{file_type}/{file}
       │   │
       │   ├─► Update tutors table with permanent URLs
       │   │
       │   └─► Delete draft file from storage
       │
       ├─► Delete draft metadata records
       │
       ├─► Clear localStorage draft references
       │
       ├─► Commit transaction
       │
       └─► Redirect to dashboard
```

#### 4. Cleanup Job Flow

```
Cron job runs daily at 2:00 AM UTC
       │
       ▼
Query expired drafts
  WHERE expires_at < NOW()
       │
       ▼
For each expired draft:
       │
       ├─► Delete file from Supabase Storage
       │
       ├─► Delete metadata record
       │
       ├─► Log deletion (clerk_id, file_type, reason)
       │
       └─► Continue on error (retry next run)
       │
       ▼
Log summary:
  - Total files deleted
  - Total errors
  - Execution time
```

## Components and Interfaces

### Frontend Components

#### 1. useDraftFileUpload Hook

Custom React hook for managing draft file uploads.

**Location**: `hooks/useDraftFileUpload.ts`

**Interface**:
```typescript
interface UseDraftFileUploadOptions {
  fileType: FileType;
  onSuccess?: (draft: DraftMetadata) => void;
  onError?: (error: Error) => void;
}

interface UseDraftFileUploadReturn {
  upload: (file: File) => Promise<void>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  clearError: () => void;
}

function useDraftFileUpload(
  options: UseDraftFileUploadOptions
): UseDraftFileUploadReturn;
```

**Responsibilities**:
- Handle file upload to `/api/drafts/upload`
- Track upload progress
- Manage error states
- Update localStorage with draft references
- Trigger callbacks on success/error

#### 2. DraftFileInput Component

Reusable file input component with draft restoration.

**Location**: `components/onboarding/DraftFileInput.tsx`

**Interface**:
```typescript
interface DraftFileInputProps {
  fileType: FileType;
  accept: string;
  maxSize: number;
  label: string;
  description?: string;
  value: File | null;
  draftMetadata?: DraftMetadata | null;
  onChange: (file: File | null) => void;
  onDraftRestore?: (draft: DraftMetadata) => void;
}
```

**Features**:
- File selection with drag-and-drop
- Upload progress indicator
- File preview (images/videos)
- Draft restoration UI
- Error display
- File replacement handling

#### 3. Modified Tutor Onboarding Form

**Location**: `app/onboarding/tutor/page.tsx`

**Changes Required**:
- Replace direct file inputs with `DraftFileInput` components
- Add draft restoration logic on mount
- Integrate `useDraftFileUpload` hook
- Update form submission to handle draft cleanup
- Add loading states for draft restoration

### Backend API Endpoints

#### 1. POST /api/drafts/upload

Upload a file as a draft.

**Request**:
```typescript
// Content-Type: multipart/form-data
{
  file: File;
  fileType: 'degree_certificate' | 'government_id' | 'nysc_certificate' 
           | 'profile_photo' | 'intro_video';
  clerkUserId: string;
}
```

**Response** (201 Created):
```typescript
{
  success: true;
  data: {
    id: string;
    clerkUserId: string;
    fileType: string;
    storagePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    expiresAt: string;
  }
}
```

**Error Responses**:
- 400: Invalid file type, size exceeded, missing parameters
- 401: Unauthorized (no valid Clerk session)
- 500: Server error (storage or database failure)

#### 2. GET /api/drafts/[clerkUserId]

Retrieve all draft metadata for a user.

**Request**:
```
GET /api/drafts/{clerkUserId}
Authorization: Bearer {clerk_session_token}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: Array<{
    id: string;
    clerkUserId: string;
    fileType: string;
    storagePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    expiresAt: string;
  }>
}
```

**Error Responses**:
- 401: Unauthorized
- 404: No drafts found
- 500: Server error

#### 3. DELETE /api/drafts/[clerkUserId]/[fileType]

Delete a specific draft file.

**Request**:
```
DELETE /api/drafts/{clerkUserId}/{fileType}
Authorization: Bearer {clerk_session_token}
```

**Response** (200 OK):
```typescript
{
  success: true;
  message: 'Draft deleted successfully'
}
```

**Error Responses**:
- 401: Unauthorized
- 404: Draft not found
- 500: Server error

#### 4. GET /api/drafts/download/[draftId]

Get a signed URL for downloading a draft file.

**Request**:
```
GET /api/drafts/download/{draftId}
Authorization: Bearer {clerk_session_token}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    signedUrl: string;
    expiresIn: number; // seconds (3600 = 1 hour)
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not file owner)
- 404: Draft not found
- 500: Server error

#### 5. POST /api/drafts/cleanup

Manual trigger for cleanup job (admin only).

**Request**:
```
POST /api/drafts/cleanup
Authorization: Bearer {admin_api_key}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    deletedCount: number;
    errorCount: number;
    executionTimeMs: number;
  }
}
```

## Data Models

### Database Schema

#### tutor_onboarding_drafts Table

```sql
CREATE TABLE tutor_onboarding_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (
    file_type IN (
      'degree_certificate',
      'government_id',
      'nysc_certificate',
      'profile_photo',
      'intro_video'
    )
  ),
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Constraints
  CONSTRAINT unique_user_file_type UNIQUE (clerk_user_id, file_type),
  CONSTRAINT fk_clerk_user FOREIGN KEY (clerk_user_id) 
    REFERENCES profiles(clerk_user_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_drafts_clerk_user_id ON tutor_onboarding_drafts(clerk_user_id);
CREATE INDEX idx_drafts_expires_at ON tutor_onboarding_drafts(expires_at);
CREATE INDEX idx_drafts_file_type ON tutor_onboarding_drafts(file_type);

-- Row Level Security
ALTER TABLE tutor_onboarding_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own drafts" ON tutor_onboarding_drafts
  FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can insert own drafts" ON tutor_onboarding_drafts
  FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update own drafts" ON tutor_onboarding_drafts
  FOR UPDATE USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can delete own drafts" ON tutor_onboarding_drafts
  FOR DELETE USING (auth.uid()::text = clerk_user_id);
```

### TypeScript Interfaces

```typescript
// File types
type FileType = 
  | 'degree_certificate'
  | 'government_id'
  | 'nysc_certificate'
  | 'profile_photo'
  | 'intro_video';

// Draft metadata from database
interface DraftMetadata {
  id: string;
  clerkUserId: string;
  fileType: FileType;
  storagePath: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
}

// Draft reference stored in localStorage
interface DraftReference {
  draftId: string;
  filename: string;
  uploadedAt: string;
  fileType: FileType;
}

// File validation rules
interface FileValidationRules {
  maxSize: number; // bytes
  acceptedMimeTypes: string[];
  acceptedExtensions: string[];
}

// Upload progress state
interface UploadProgress {
  fileType: FileType;
  progress: number; // 0-100
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}
```

### Supabase Storage Structure

#### Bucket Configuration

**Bucket Name**: `drafts`

**Settings**:
- Public: `false` (private bucket)
- File size limit: 100 MB
- Allowed MIME types: Configured via RLS policies

**Folder Structure**:
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
│       └── 1704067600000_intro.webm
├── {clerk_user_id_2}/
│   └── ...
```

**File Naming Convention**:
```
{timestamp}_{sanitized_original_filename}

Example:
1704067200000_my_degree_certificate.pdf
```

**Storage Policies**:
```sql
-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own drafts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'drafts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read own drafts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'drafts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own drafts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'drafts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### File Validation Rules

```typescript
const FILE_VALIDATION_RULES: Record<FileType, FileValidationRules> = {
  degree_certificate: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  government_id: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  nysc_certificate: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  profile_photo: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    acceptedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/webp'
    ],
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.heic', '.webp']
  },
  intro_video: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    acceptedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ],
    acceptedExtensions: ['.mp4', '.webm', '.mov']
  }
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

Before defining correctness properties, I analyzed each acceptance criterion to determine if it's testable as a property, example, edge case, or not testable:

**Requirement 1: Auto-Save File Uploads**

1.1. WHEN a tutor selects a file in any file upload field, THE Draft_Storage_System SHALL upload the file to Supabase_Storage within 5 seconds
  - Thoughts: This is a performance requirement with a specific time constraint. While we can test that uploads complete, the 5-second constraint is environment-dependent (network speed, file size, server load). This is better suited for performance testing rather than property-based testing.
  - Testable: no (performance requirement)

1.2. WHEN a file upload completes successfully, THE Tutor_Onboarding_Form SHALL display a visual confirmation indicator
  - Thoughts: This is a UI behavior requirement. We can test that the UI state changes after upload, but "visual confirmation" is subjective.
  - Testable: yes - example

1.3. WHEN a file upload fails, THE Tutor_Onboarding_Form SHALL display an error message and allow retry
  - Thoughts: This is about error handling behavior. We can test that failed uploads trigger error states.
  - Testable: yes - property

1.4. THE Draft_Storage_System SHALL accept files up to 5MB for documents and 100MB for videos
  - Thoughts: This is a validation rule that should apply to all files. We can generate random files of various sizes and test the boundaries.
  - Testable: yes - property

1.5. WHEN uploading a Draft_File, THE Draft_Storage_System SHALL associate it with the user's Clerk_ID
  - Thoughts: This is a rule that should hold for all uploads. We can test that every uploaded file has the correct clerk_id association.
  - Testable: yes - property

1.6. THE Draft_Storage_System SHALL store Draft_Files in a dedicated storage bucket separate from final submissions
  - Thoughts: This is about storage organization. We can verify that all draft files are in the correct bucket.
  - Testable: yes - property

**Requirement 2: Draft File Storage Structure**

2.1. THE Draft_Storage_System SHALL store Draft_Files in Supabase_Storage using the path pattern: `drafts/{clerk_id}/{file_type}/{timestamp}_{filename}`
  - Thoughts: This is a rule about path formatting that should hold for all uploads. We can test that all storage paths match this pattern.
  - Testable: yes - property

2.2. THE Draft_Storage_System SHALL support five file types: `degree_certificate`, `government_id`, `nysc_certificate`, `profile_photo`, and `intro_video`
  - Thoughts: This is a validation rule. We can test that only these file types are accepted and others are rejected.
  - Testable: yes - property

2.3. THE Draft_Storage_System SHALL generate unique filenames using timestamp and original filename to prevent collisions
  - Thoughts: This is about uniqueness. We can test that multiple uploads don't create collisions.
  - Testable: yes - property

2.4. THE Draft_Storage_System SHALL store Draft_Metadata in a database table with fields: id, clerk_user_id, file_type, storage_path, original_filename, file_size, mime_type, uploaded_at, expires_at
  - Thoughts: This is about data structure. We can test that all metadata records contain these required fields.
  - Testable: yes - property

2.5. WHEN a Draft_File is uploaded, THE Draft_Storage_System SHALL set expires_at to 30 days from upload time
  - Thoughts: This is a rule that should hold for all uploads. We can test that expires_at is always 30 days after uploaded_at.
  - Testable: yes - property

**Requirement 3: Draft File Restoration**

3.1. WHEN a tutor loads the Tutor_Onboarding_Form, THE Draft_Storage_System SHALL query for Draft_Files associated with their Clerk_ID
  - Thoughts: This is about the query behavior. We can test that the query returns only files matching the user's clerk_id.
  - Testable: yes - property

3.2. WHEN Draft_Files exist for a user, THE Tutor_Onboarding_Form SHALL display file names and preview thumbnails for each uploaded file
  - Thoughts: This is a UI rendering requirement. We can test that the UI state includes the file information.
  - Testable: yes - example

3.3. WHEN Draft_Files exist for a user, THE Tutor_Onboarding_Form SHALL populate the form state with file references
  - Thoughts: This is about state management. We can test that form state is updated with draft references.
  - Testable: yes - property

3.4. THE Draft_Storage_System SHALL retrieve Draft_Metadata within 2 seconds of form load
  - Thoughts: This is a performance requirement, environment-dependent.
  - Testable: no (performance requirement)

3.5. WHEN displaying restored files, THE Tutor_Onboarding_Form SHALL show the original filename and upload date
  - Thoughts: This is about data display. We can test that the displayed data matches the metadata.
  - Testable: yes - property

**Requirement 4: Draft File Replacement**

4.1. WHEN a tutor uploads a new file for a file type that already has a Draft_File, THE Draft_Storage_System SHALL upload the new file
  - Thoughts: This is about replacement behavior. We can test that uploading to an existing file_type succeeds.
  - Testable: yes - property

4.2. WHEN a new file upload succeeds, THE Draft_Storage_System SHALL delete the previous Draft_File from Supabase_Storage
  - Thoughts: This is a cleanup rule. We can test that old files are removed after replacement.
  - Testable: yes - property

4.3. WHEN a new file upload succeeds, THE Draft_Storage_System SHALL update the Draft_Metadata record with the new file information
  - Thoughts: This is about metadata updates. We can test that metadata reflects the new file.
  - Testable: yes - property

4.4. IF the new file upload fails, THE Draft_Storage_System SHALL preserve the existing Draft_File
  - Thoughts: This is about error handling and atomicity. We can test that failed uploads don't affect existing drafts.
  - Testable: yes - property

4.5. THE Draft_Storage_System SHALL complete the replacement operation atomically to prevent data loss
  - Thoughts: This is about transaction integrity. We can test that partial states don't occur.
  - Testable: yes - property

**Requirement 5: Draft Cleanup on Submission**

5.1. WHEN a tutor successfully submits the Tutor_Onboarding_Form, THE Draft_Storage_System SHALL move all Draft_Files to permanent storage locations
  - Thoughts: This is about file migration. We can test that all drafts are moved to permanent locations.
  - Testable: yes - property

5.2. WHEN moving files to permanent storage, THE Draft_Storage_System SHALL update the tutors table with the permanent file URLs
  - Thoughts: This is about database updates. We can test that the tutors table is updated correctly.
  - Testable: yes - property

5.3. WHEN files are moved to permanent storage, THE Draft_Storage_System SHALL delete the Draft_Metadata records
  - Thoughts: This is about cleanup. We can test that draft metadata is removed after submission.
  - Testable: yes - property

5.4. IF the submission process fails, THE Draft_Storage_System SHALL preserve all Draft_Files and Draft_Metadata
  - Thoughts: This is about rollback behavior. We can test that failed submissions don't delete drafts.
  - Testable: yes - property

5.5. THE Draft_Storage_System SHALL complete the submission cleanup within 10 seconds
  - Thoughts: This is a performance requirement, environment-dependent.
  - Testable: no (performance requirement)

**Requirement 6: Automatic Draft Expiration**

6.1. THE Cleanup_Job SHALL run daily at 2:00 AM UTC
  - Thoughts: This is about scheduling, not functional behavior we can test in unit/property tests.
  - Testable: no (scheduling requirement)

6.2. WHEN the Cleanup_Job runs, THE Draft_Storage_System SHALL identify all Draft_Metadata records where expires_at is before the current time
  - Thoughts: This is about query logic. We can test that the cleanup query correctly identifies expired drafts.
  - Testable: yes - property

6.3. WHEN expired Draft_Files are identified, THE Draft_Storage_System SHALL delete the files from Supabase_Storage
  - Thoughts: This is about cleanup behavior. We can test that expired files are deleted.
  - Testable: yes - property

6.4. WHEN expired Draft_Files are deleted, THE Draft_Storage_System SHALL delete the corresponding Draft_Metadata records
  - Thoughts: This is about data consistency. We can test that metadata is deleted with files.
  - Testable: yes - property

6.5. THE Cleanup_Job SHALL log the number of files deleted and any errors encountered
  - Thoughts: This is about logging behavior. We can test that logs are created.
  - Testable: yes - example

6.6. IF a file deletion fails, THE Cleanup_Job SHALL continue processing remaining files and retry failed deletions on the next run
  - Thoughts: This is about error resilience. We can test that failures don't stop the cleanup process.
  - Testable: yes - property

**Requirement 7: Draft File Security**

7.1. THE Draft_Storage_System SHALL enforce Row Level Security policies ensuring users can only access their own Draft_Files
  - Thoughts: This is a security rule. We can test that users cannot access other users' files.
  - Testable: yes - property

7.2. WHEN a user requests a Draft_File, THE Draft_Storage_System SHALL verify the Clerk_ID matches the file owner
  - Thoughts: This is about authorization. We can test that mismatched clerk_ids are rejected.
  - Testable: yes - property

7.3. THE Draft_Storage_System SHALL generate signed URLs with 1-hour expiration for file downloads
  - Thoughts: This is about URL generation. We can test that signed URLs have the correct expiration.
  - Testable: yes - property

7.4. THE Draft_Storage_System SHALL reject requests to access Draft_Files without valid authentication
  - Thoughts: This is about authentication. We can test that unauthenticated requests are rejected.
  - Testable: yes - property

7.5. THE Draft_Storage_System SHALL use HTTPS for all file upload and download operations
  - Thoughts: This is about protocol enforcement, typically handled at infrastructure level.
  - Testable: no (infrastructure requirement)

**Requirement 8: API Endpoints for Draft Management**

8.1. THE Draft_Storage_System SHALL provide a POST endpoint `/api/drafts/upload` that accepts multipart form data with fields: file, fileType, clerkUserId
  - Thoughts: This is about API contract. We can test that the endpoint accepts the correct parameters.
  - Testable: yes - example

8.2. THE Draft_Storage_System SHALL provide a GET endpoint `/api/drafts/{clerkUserId}` that returns all Draft_Metadata for a user
  - Thoughts: This is about API contract. We can test that the endpoint returns the correct data.
  - Testable: yes - example

8.3. THE Draft_Storage_System SHALL provide a DELETE endpoint `/api/drafts/{clerkUserId}/{fileType}` that removes a specific Draft_File
  - Thoughts: This is about API contract. We can test that the endpoint deletes the correct file.
  - Testable: yes - example

8.4. THE Draft_Storage_System SHALL provide a GET endpoint `/api/drafts/download/{draftId}` that returns a signed URL for file access
  - Thoughts: This is about API contract. We can test that the endpoint returns a valid signed URL.
  - Testable: yes - example

8.5. WHEN an API endpoint receives invalid parameters, THE Draft_Storage_System SHALL return a 400 status code with error details
  - Thoughts: This is about error handling. We can test that invalid inputs return 400 errors.
  - Testable: yes - property

8.6. WHEN an API endpoint encounters a server error, THE Draft_Storage_System SHALL return a 500 status code and log the error
  - Thoughts: This is about error handling. We can test that server errors return 500 status.
  - Testable: yes - property

8.7. THE Draft_Storage_System SHALL return appropriate HTTP status codes: 200 for success, 201 for creation, 404 for not found, 401 for unauthorized
  - Thoughts: This is about HTTP semantics. We can test that correct status codes are returned.
  - Testable: yes - property

**Requirement 9: Database Schema for Draft Metadata**

9.1. THE Draft_Storage_System SHALL create a table named `tutor_onboarding_drafts` with columns: id, clerk_user_id, file_type, storage_path, original_filename, file_size, mime_type, uploaded_at, expires_at
  - Thoughts: This is about schema structure, verified by migration scripts.
  - Testable: no (schema definition)

9.2. THE Draft_Storage_System SHALL create an index on clerk_user_id for efficient user queries
  - Thoughts: This is about database optimization, verified by migration scripts.
  - Testable: no (schema definition)

9.3. THE Draft_Storage_System SHALL create an index on expires_at for efficient cleanup queries
  - Thoughts: This is about database optimization, verified by migration scripts.
  - Testable: no (schema definition)

9.4. THE Draft_Storage_System SHALL create a unique constraint on (clerk_user_id, file_type) to prevent duplicate file types per user
  - Thoughts: This is a database constraint. We can test that duplicate uploads are rejected or replaced.
  - Testable: yes - property

9.5. THE Draft_Storage_System SHALL add a foreign key constraint referencing profiles(clerk_user_id) with ON DELETE CASCADE
  - Thoughts: This is about referential integrity, enforced by database.
  - Testable: no (schema definition)

**Requirement 10: Error Handling and User Feedback**

10.1. WHEN a file upload is in progress, THE Tutor_Onboarding_Form SHALL display a progress indicator showing upload percentage
  - Thoughts: This is about UI state during upload. We can test that progress state is updated.
  - Testable: yes - example

10.2. WHEN a file upload succeeds, THE Tutor_Onboarding_Form SHALL display a success message with a checkmark icon for 3 seconds
  - Thoughts: This is about UI feedback. The 3-second duration is a UX detail.
  - Testable: yes - example

10.3. WHEN a file upload fails due to network issues, THE Tutor_Onboarding_Form SHALL display an error message and a retry button
  - Thoughts: This is about error UI. We can test that network errors trigger the correct UI state.
  - Testable: yes - example

10.4. WHEN a file upload fails due to file size limits, THE Tutor_Onboarding_Form SHALL display an error message specifying the size limit
  - Thoughts: This is about validation error messages. We can test that size errors include the limit.
  - Testable: yes - property

10.5. WHEN a file upload fails due to invalid file type, THE Tutor_Onboarding_Form SHALL display an error message listing accepted file types
  - Thoughts: This is about validation error messages. We can test that type errors include accepted types.
  - Testable: yes - property

10.6. THE Tutor_Onboarding_Form SHALL allow users to dismiss error messages manually
  - Thoughts: This is about UI interaction. We can test that error state can be cleared.
  - Testable: yes - example

**Requirement 11: Performance Requirements**

11.1-11.5: All performance requirements
  - Thoughts: These are performance benchmarks that depend on network conditions and hardware.
  - Testable: no (performance requirements)

**Requirement 12: File Type Validation**

12.1. THE Draft_Storage_System SHALL accept image files (JPEG, PNG, HEIC, WebP) for profile_photo with maximum size 5MB
  - Thoughts: This is a validation rule. We can test that valid image types are accepted and invalid ones rejected.
  - Testable: yes - property

12.2. THE Draft_Storage_System SHALL accept document files (PDF, JPEG, PNG) for degree_certificate, government_id, and nysc_certificate with maximum size 5MB each
  - Thoughts: This is a validation rule. We can test that valid document types are accepted.
  - Testable: yes - property

12.3. THE Draft_Storage_System SHALL accept video files (MP4, WebM, MOV) for intro_video with maximum size 100MB
  - Thoughts: This is a validation rule. We can test that valid video types are accepted.
  - Testable: yes - property

12.4. WHEN a file is uploaded, THE Draft_Storage_System SHALL verify the file MIME type matches the file extension
  - Thoughts: This is a validation rule. We can test that mismatched MIME types are rejected.
  - Testable: yes - property

12.5. WHEN a file fails validation, THE Draft_Storage_System SHALL return a 400 error with a descriptive message
  - Thoughts: This is about error responses. We can test that validation failures return 400.
  - Testable: yes - property

12.6. THE Draft_Storage_System SHALL reject files with executable extensions (.exe, .sh, .bat, .js, .py)
  - Thoughts: This is a security validation rule. We can test that executable files are rejected.
  - Testable: yes - property

**Requirement 13: Integration with Existing Form State**

13.1. WHEN a Draft_File is uploaded, THE Tutor_Onboarding_Form SHALL store a reference object in localStorage containing: draftId, filename, uploadedAt, fileType
  - Thoughts: This is about localStorage integration. We can test that localStorage is updated after upload.
  - Testable: yes - property

13.2. WHEN the form loads, THE Tutor_Onboarding_Form SHALL check localStorage for draft file references before querying the server
  - Thoughts: This is about load sequence. We can test that localStorage is checked first.
  - Testable: yes - example

13.3. WHEN draft file references exist in localStorage, THE Tutor_Onboarding_Form SHALL validate they still exist on the server
  - Thoughts: This is about validation. We can test that server validation occurs.
  - Testable: yes - property

13.4. IF a draft file reference in localStorage no longer exists on the server, THE Tutor_Onboarding_Form SHALL remove the reference and prompt the user to re-upload
  - Thoughts: This is about sync behavior. We can test that stale references are cleaned up.
  - Testable: yes - property

13.5. THE Tutor_Onboarding_Form SHALL clear draft file references from localStorage when the application is successfully submitted
  - Thoughts: This is about cleanup. We can test that localStorage is cleared on submission.
  - Testable: yes - property

**Requirement 14: Monitoring and Logging**

14.1-14.6: All logging and monitoring requirements
  - Thoughts: These are about observability, not functional behavior we test with properties.
  - Testable: no (observability requirements)

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidation opportunities:

**Redundancy Analysis:**

1. **File Size Validation (1.4, 12.1, 12.2, 12.3)**: These can be consolidated into a single property that tests file size limits for all file types.

2. **File Type Validation (2.2, 12.1, 12.2, 12.3, 12.6)**: These can be consolidated into a single property that tests accepted and rejected file types.

3. **Metadata Structure (2.4, 2.5)**: These can be combined into a property that validates complete metadata structure including expiration.

4. **File Replacement (4.1, 4.2, 4.3)**: These describe a single atomic operation and can be combined into one property.

5. **Security Checks (7.1, 7.2, 7.4)**: These all test authorization and can be consolidated into properties about access control.

6. **HTTP Status Codes (8.5, 8.6, 8.7)**: These can be consolidated into a property about correct HTTP semantics.

7. **localStorage Integration (13.1, 13.3, 13.4, 13.5)**: These describe the localStorage sync behavior and can be consolidated.

**Consolidated Properties:**

After reflection, I'll create properties that:
- Combine related validation rules
- Test complete workflows rather than individual steps
- Eliminate redundant checks
- Focus on unique validation value


### Property 1: File Upload Creates Complete Metadata

*For any* valid file upload (within size limits, accepted type), the system should create a metadata record containing all required fields (id, clerk_user_id, file_type, storage_path, original_filename, file_size, mime_type, uploaded_at, expires_at) where expires_at is exactly 30 days after uploaded_at.

**Validates: Requirements 1.5, 1.6, 2.4, 2.5**

### Property 2: Storage Path Format Consistency

*For any* uploaded draft file, the storage path should match the pattern `drafts/{clerk_id}/{file_type}/{timestamp}_{filename}` and the file should exist in the 'drafts' bucket (not permanent storage).

**Validates: Requirements 2.1, 1.6**

### Property 3: File Type Validation

*For any* file upload attempt, the system should accept only the five supported file types (degree_certificate, government_id, nysc_certificate, profile_photo, intro_video) and reject all other file type values with a 400 error.

**Validates: Requirements 2.2, 8.5**

### Property 4: File Size Validation by Type

*For any* file upload, the system should enforce size limits based on file type: 5MB for documents (degree_certificate, government_id, nysc_certificate) and profile_photo, 100MB for intro_video, rejecting oversized files with a 400 error that includes the size limit.

**Validates: Requirements 1.4, 12.1, 12.2, 12.3, 10.4**

### Property 5: MIME Type and Extension Validation

*For any* file upload, the system should validate that the MIME type matches the file extension and both are in the accepted list for that file type, rejecting mismatches or invalid types with a 400 error that lists accepted types.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 10.5**

### Property 6: Executable File Rejection

*For any* file with an executable extension (.exe, .sh, .bat, .js, .py), the system should reject the upload with a 400 error regardless of the declared file type.

**Validates: Requirements 12.6**

### Property 7: Filename Uniqueness

*For any* two files uploaded by the same user for the same file type at different times, the generated storage paths should be unique (no collisions).

**Validates: Requirements 2.3**

### Property 8: User-Scoped Draft Retrieval

*For any* user querying their drafts, the system should return only draft files where clerk_user_id matches the authenticated user's ID, never returning other users' files.

**Validates: Requirements 3.1, 7.1, 7.2**

### Property 9: Draft Restoration Completeness

*For any* user with existing drafts, when the form loads, the restored draft metadata should match the stored metadata (original_filename, uploadedAt, fileType) for all draft files.

**Validates: Requirements 3.3, 3.5**

### Property 10: Atomic File Replacement

*For any* file upload to a file_type that already has a draft, the system should atomically: upload the new file, update the metadata record, and delete the old file from storage, such that at no point are both files present or no files present.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 11: Failed Upload Preservation

*For any* file upload that fails (network error, validation error, storage error), the system should preserve any existing draft file and metadata for that file_type unchanged.

**Validates: Requirements 4.4**

### Property 12: Unique File Type Per User

*For any* user and file_type combination, the system should maintain at most one draft file, enforcing the unique constraint on (clerk_user_id, file_type).

**Validates: Requirements 9.4**

### Property 13: Submission Moves All Drafts

*For any* successful form submission, all draft files for that user should be moved from the drafts bucket to permanent storage, the tutors table should be updated with permanent URLs, and all draft metadata records should be deleted.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 14: Failed Submission Preserves Drafts

*For any* form submission that fails (validation error, database error, storage error), all draft files and metadata should remain unchanged and accessible for future attempts.

**Validates: Requirements 5.4**

### Property 15: Expired Draft Identification

*For any* draft where expires_at is before the current time, the cleanup job should identify it as expired and include it in the deletion batch.

**Validates: Requirements 6.2**

### Property 16: Cleanup Deletes Files and Metadata

*For any* expired draft identified by the cleanup job, both the file in storage and the metadata record should be deleted.

**Validates: Requirements 6.3, 6.4**

### Property 17: Cleanup Error Resilience

*For any* batch of expired drafts where some deletions fail, the cleanup job should continue processing remaining drafts and not abort the entire operation.

**Validates: Requirements 6.6**

### Property 18: Unauthorized Access Rejection

*For any* request to access a draft file without valid authentication or with a clerk_user_id that doesn't match the file owner, the system should return a 401 (unauthenticated) or 403 (unauthorized) error.

**Validates: Requirements 7.2, 7.4**

### Property 19: Signed URL Expiration

*For any* signed URL generated for draft file download, the URL should have an expiration time of exactly 1 hour from generation.

**Validates: Requirements 7.3**

### Property 20: HTTP Status Code Semantics

*For any* API request, the system should return semantically correct HTTP status codes: 200 for successful GET/DELETE, 201 for successful POST, 400 for validation errors, 401 for authentication errors, 403 for authorization errors, 404 for not found, 500 for server errors.

**Validates: Requirements 8.5, 8.6, 8.7**

### Property 21: localStorage Synchronization

*For any* successful file upload, the system should store a draft reference in localStorage containing {draftId, filename, uploadedAt, fileType}, and on successful form submission, should clear all draft references from localStorage.

**Validates: Requirements 13.1, 13.5**

### Property 22: Stale Reference Cleanup

*For any* draft reference in localStorage that no longer exists on the server (deleted or expired), the form should remove the stale reference from localStorage and update the UI to reflect the missing file.

**Validates: Requirements 13.3, 13.4**

### Property 23: Upload Error Handling

*For any* file upload that fails, the system should return an appropriate error response and the form should display an error message with retry capability.

**Validates: Requirements 1.3, 8.5**


## Error Handling

### Error Categories

The draft storage system must handle errors across multiple layers:

#### 1. Client-Side Validation Errors

**File Size Errors**:
- Trigger: File exceeds maximum size for its type
- Response: Immediate rejection before upload
- User Feedback: "File size exceeds limit. Maximum size for [file_type] is [limit]MB"
- Recovery: User selects a smaller file

**File Type Errors**:
- Trigger: File extension or MIME type not in accepted list
- Response: Immediate rejection before upload
- User Feedback: "Invalid file type. Accepted types: [list]"
- Recovery: User selects a valid file type

**Missing Authentication**:
- Trigger: User not authenticated with Clerk
- Response: Redirect to sign-in
- User Feedback: "Please sign in to continue"
- Recovery: User completes authentication

#### 2. Network Errors

**Upload Timeout**:
- Trigger: Upload takes longer than 60 seconds
- Response: Abort upload, preserve existing draft
- User Feedback: "Upload timed out. Please check your connection and try again"
- Recovery: Retry button, existing draft preserved

**Connection Lost**:
- Trigger: Network disconnection during upload
- Response: Abort upload, preserve existing draft
- User Feedback: "Connection lost. Your previous upload is safe. Please reconnect and try again"
- Recovery: Automatic retry when connection restored

**Chunked Upload Interruption**:
- Trigger: Large file upload interrupted mid-transfer
- Response: Save progress, allow resumption
- User Feedback: "Upload paused. Click to resume from [percentage]%"
- Recovery: Resume from last completed chunk

#### 3. Server-Side Errors

**Storage Quota Exceeded**:
- Trigger: Supabase storage bucket full
- Response: 507 Insufficient Storage
- User Feedback: "Storage temporarily unavailable. Please try again later"
- Recovery: Admin notification, user retry after cleanup
- Logging: Alert sent to monitoring system

**Database Connection Error**:
- Trigger: Cannot connect to PostgreSQL
- Response: 503 Service Unavailable
- User Feedback: "Service temporarily unavailable. Your files are safe. Please try again in a few moments"
- Recovery: Automatic retry with exponential backoff
- Logging: Critical alert, automatic retry

**File Already Exists (Race Condition)**:
- Trigger: Concurrent uploads for same file_type
- Response: Use unique constraint to handle, update existing record
- User Feedback: Transparent to user (handled automatically)
- Recovery: Automatic - last upload wins

**Metadata Insert Failure**:
- Trigger: Database constraint violation or connection error
- Response: Rollback storage upload, return 500
- User Feedback: "Upload failed. Please try again"
- Recovery: User retry, no orphaned files
- Logging: Error logged with full context

#### 4. Authorization Errors

**Mismatched Clerk ID**:
- Trigger: User attempts to access another user's draft
- Response: 403 Forbidden
- User Feedback: "Access denied"
- Recovery: None - security violation logged
- Logging: Security event logged with user IDs

**Expired Session**:
- Trigger: Clerk session expired during upload
- Response: 401 Unauthorized
- User Feedback: "Session expired. Please sign in again"
- Recovery: Redirect to sign-in, preserve form data in localStorage

**Invalid API Key (Cleanup Job)**:
- Trigger: Cleanup job called with invalid admin key
- Response: 401 Unauthorized
- User Feedback: N/A (admin endpoint)
- Recovery: None - security violation logged
- Logging: Security alert

#### 5. Data Integrity Errors

**Orphaned Storage Files**:
- Trigger: Metadata insert fails after storage upload
- Response: Cleanup job removes orphaned files
- User Feedback: None (handled automatically)
- Recovery: Automatic cleanup during next job run
- Logging: Orphaned file logged for monitoring

**Missing Storage Files**:
- Trigger: Metadata exists but storage file deleted
- Response: Delete stale metadata record
- User Feedback: "File no longer available. Please upload again"
- Recovery: User re-uploads file
- Logging: Data inconsistency logged

**Stale localStorage References**:
- Trigger: localStorage references file that doesn't exist on server
- Response: Remove stale reference, update UI
- User Feedback: "Previous upload expired. Please upload again"
- Recovery: User re-uploads file
- Logging: Normal operation, no alert

### Error Recovery Strategies

#### Transactional Operations

All multi-step operations use transactions to ensure atomicity:

```typescript
// File replacement transaction
async function replaceFile(userId: string, fileType: string, newFile: File) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Get existing draft metadata
    const existing = await client.query(
      'SELECT storage_path FROM tutor_onboarding_drafts WHERE clerk_user_id = $1 AND file_type = $2',
      [userId, fileType]
    );
    
    // 2. Upload new file
    const newPath = await storage.upload(newFile);
    
    // 3. Update metadata
    await client.query(
      'UPDATE tutor_onboarding_drafts SET storage_path = $1, ... WHERE clerk_user_id = $2 AND file_type = $3',
      [newPath, userId, fileType]
    );
    
    // 4. Delete old file
    if (existing.rows[0]) {
      await storage.delete(existing.rows[0].storage_path);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    // Cleanup: delete new file if it was uploaded
    if (newPath) await storage.delete(newPath);
    throw error;
  } finally {
    client.release();
  }
}
```

#### Retry Logic

Implement exponential backoff for transient errors:

```typescript
async function uploadWithRetry(file: File, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(file);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (!isRetryable(error)) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await sleep(delay);
    }
  }
}

function isRetryable(error: Error): boolean {
  return error.message.includes('ECONNRESET') ||
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('503');
}
```

#### Graceful Degradation

When draft restoration fails, allow form to function without drafts:

```typescript
async function loadDrafts(userId: string) {
  try {
    const drafts = await fetchDrafts(userId);
    return drafts;
  } catch (error) {
    console.error('Failed to load drafts:', error);
    // Show warning but allow form to work
    showWarning('Could not load previous uploads. You can continue with new uploads.');
    return [];
  }
}
```

### Error Logging and Monitoring

All errors are logged with structured data for debugging and monitoring:

```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  category: 'upload' | 'download' | 'cleanup' | 'auth' | 'validation';
  userId?: string;
  fileType?: string;
  errorMessage: string;
  errorStack?: string;
  requestId: string;
  metadata: Record<string, any>;
}
```

**Alert Thresholds**:
- Upload failure rate > 10% over 1 hour: Warning alert
- Upload failure rate > 25% over 1 hour: Critical alert
- Storage quota > 90%: Warning alert
- Database connection failures: Immediate critical alert
- Security violations (unauthorized access): Immediate security alert

## Testing Strategy

### Dual Testing Approach

The draft storage system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and integration points
**Property Tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library**: `fast-check` (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Seed-based reproducibility for failed tests
- Shrinking enabled to find minimal failing examples

**Test Tagging**:
Each property test must reference its design document property using a comment tag:

```typescript
/**
 * Feature: tutor-onboarding-draft-storage
 * Property 1: File Upload Creates Complete Metadata
 * 
 * For any valid file upload (within size limits, accepted type), the system
 * should create a metadata record containing all required fields where
 * expires_at is exactly 30 days after uploaded_at.
 */
test('property: file upload creates complete metadata', async () => {
  await fc.assert(
    fc.asyncProperty(
      validFileArbitrary(),
      async (file) => {
        const result = await uploadDraft(file);
        
        // Verify all required fields present
        expect(result.metadata).toHaveProperty('id');
        expect(result.metadata).toHaveProperty('clerkUserId');
        expect(result.metadata).toHaveProperty('fileType');
        expect(result.metadata).toHaveProperty('storagePath');
        expect(result.metadata).toHaveProperty('originalFilename');
        expect(result.metadata).toHaveProperty('fileSize');
        expect(result.metadata).toHaveProperty('mimeType');
        expect(result.metadata).toHaveProperty('uploadedAt');
        expect(result.metadata).toHaveProperty('expiresAt');
        
        // Verify expires_at is 30 days after uploaded_at
        const uploadedAt = new Date(result.metadata.uploadedAt);
        const expiresAt = new Date(result.metadata.expiresAt);
        const diffDays = (expiresAt.getTime() - uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeCloseTo(30, 0);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
tests/
├── unit/
│   ├── api/
│   │   ├── drafts-upload.test.ts
│   │   ├── drafts-retrieve.test.ts
│   │   ├── drafts-delete.test.ts
│   │   └── drafts-download.test.ts
│   ├── hooks/
│   │   └── useDraftFileUpload.test.ts
│   ├── components/
│   │   └── DraftFileInput.test.tsx
│   └── utils/
│       ├── file-validation.test.ts
│       └── storage-path.test.ts
├── property/
│   ├── upload-properties.test.ts
│   ├── retrieval-properties.test.ts
│   ├── replacement-properties.test.ts
│   ├── cleanup-properties.test.ts
│   └── security-properties.test.ts
├── integration/
│   ├── full-upload-flow.test.ts
│   ├── form-submission-flow.test.ts
│   └── cleanup-job.test.ts
└── fixtures/
    ├── test-files/
    │   ├── valid-pdf.pdf
    │   ├── valid-image.jpg
    │   ├── valid-video.mp4
    │   ├── oversized-file.pdf
    │   └── invalid-executable.exe
    └── arbitraries.ts
```

### Property Test Generators (Arbitraries)

```typescript
// fixtures/arbitraries.ts
import * as fc from 'fast-check';

export const fileTypeArbitrary = () =>
  fc.constantFrom(
    'degree_certificate',
    'government_id',
    'nysc_certificate',
    'profile_photo',
    'intro_video'
  );

export const validFileArbitrary = () =>
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom(
      'application/pdf',
      'image/jpeg',
      'image/png',
      'video/mp4'
    ),
    size: fc.integer({ min: 1, max: 5 * 1024 * 1024 }), // Up to 5MB
    fileType: fileTypeArbitrary(),
  });

export const invalidFileSizeArbitrary = (fileType: string) => {
  const maxSize = fileType === 'intro_video' ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
  return fc.integer({ min: maxSize + 1, max: maxSize * 2 });
};

export const clerkUserIdArbitrary = () =>
  fc.string({ minLength: 20, maxLength: 30 }); // Clerk IDs are typically 20-30 chars

export const draftMetadataArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    clerkUserId: clerkUserIdArbitrary(),
    fileType: fileTypeArbitrary(),
    storagePath: fc.string(),
    originalFilename: fc.string({ minLength: 1, maxLength: 100 }),
    fileSize: fc.integer({ min: 1, max: 100 * 1024 * 1024 }),
    mimeType: fc.string(),
    uploadedAt: fc.date(),
    expiresAt: fc.date(),
  });
```

### Unit Test Coverage Requirements

**Minimum Coverage Targets**:
- API Routes: 90% line coverage
- Hooks: 85% line coverage
- Components: 80% line coverage
- Utility Functions: 95% line coverage

**Critical Paths Requiring 100% Coverage**:
- File validation logic
- Authorization checks
- Transaction rollback logic
- Error handling paths

### Integration Test Scenarios

**1. Full Upload Flow**:
- User selects file → Upload to API → Storage upload → Metadata creation → localStorage update → UI update

**2. Draft Restoration Flow**:
- Form load → Check localStorage → Query API → Validate drafts → Generate signed URLs → Update UI

**3. File Replacement Flow**:
- User uploads new file → API receives upload → Delete old file → Upload new file → Update metadata → Update UI

**4. Form Submission Flow**:
- User submits form → Validate data → Move drafts to permanent storage → Update tutors table → Delete draft metadata → Clear localStorage → Redirect

**5. Cleanup Job Flow**:
- Job triggered → Query expired drafts → Delete files from storage → Delete metadata → Log results

### Mock Strategy

**Supabase Storage Mocks**:
```typescript
const mockStorage = {
  upload: jest.fn().mockResolvedValue({ path: 'mock/path' }),
  download: jest.fn().mockResolvedValue(new Blob()),
  delete: jest.fn().mockResolvedValue(undefined),
  createSignedUrl: jest.fn().mockResolvedValue({ signedUrl: 'https://mock.url' }),
};
```

**Database Mocks**:
```typescript
const mockDb = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
};
```

**Clerk Auth Mocks**:
```typescript
const mockClerkUser = {
  id: 'user_test123',
  primaryEmailAddress: { emailAddress: 'test@example.com' },
};

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockClerkUser }),
  auth: () => ({ userId: 'user_test123' }),
}));
```

### Performance Testing

While not part of unit/property tests, performance requirements should be validated separately:

**Load Testing**:
- Concurrent uploads: 50 users uploading simultaneously
- Large file uploads: 100MB video files
- Cleanup job: 10,000 expired drafts

**Metrics to Track**:
- Upload time (p50, p95, p99)
- API response time
- Database query time
- Storage operation time
- Cleanup job execution time

### Continuous Integration

**Pre-commit Hooks**:
- Run unit tests
- Run linter
- Check TypeScript types

**CI Pipeline**:
1. Run all unit tests
2. Run all property tests (100 iterations each)
3. Run integration tests
4. Generate coverage report
5. Fail if coverage below thresholds
6. Run security scans (dependency vulnerabilities)

**Test Execution Time Targets**:
- Unit tests: < 30 seconds
- Property tests: < 2 minutes
- Integration tests: < 1 minute
- Total CI pipeline: < 5 minutes

