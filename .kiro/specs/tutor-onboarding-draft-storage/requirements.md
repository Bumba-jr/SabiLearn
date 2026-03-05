# Requirements Document

## Introduction

This document specifies requirements for implementing server-side draft storage for file uploads in the tutor onboarding form. Currently, the form saves text data to localStorage, but uploaded files (Degree Certificate, Government ID, Profile Photo, Intro Video, NYSC Certificate) are lost when users refresh the page due to browser storage limitations. This feature will enable automatic server-side storage of uploaded files as drafts, allowing tutors to complete the onboarding process across multiple sessions without losing their file uploads.

## Glossary

- **Draft_Storage_System**: The server-side system that manages temporary file storage for incomplete onboarding forms
- **Tutor_Onboarding_Form**: The multi-step form at app/onboarding/tutor/page.tsx where tutors submit their application
- **File_Upload**: Any of the five file types: Degree Certificate, Government ID, Profile Photo, Intro Video, or NYSC Certificate
- **Clerk_ID**: The unique identifier assigned to users by the Clerk authentication system
- **Supabase_Storage**: The file storage service provided by Supabase for storing binary files
- **Draft_File**: A file uploaded during onboarding but not yet submitted as part of a completed application
- **Auto_Save**: The automatic process of uploading files to the server immediately after selection
- **Draft_Metadata**: Database records tracking draft file locations, upload times, and associations with users
- **Cleanup_Job**: A scheduled process that removes expired draft files and metadata
- **Draft_Expiry_Period**: The time duration (30 days) after which unused draft files are automatically deleted
- **File_Restoration**: The process of retrieving and displaying previously uploaded draft files when a user returns to the form

## Requirements

### Requirement 1: Auto-Save File Uploads

**User Story:** As a tutor completing the onboarding form, I want my uploaded files to be automatically saved to the server, so that I don't lose them if I refresh the page or return later.

#### Acceptance Criteria

1. WHEN a tutor selects a file in any file upload field, THE Draft_Storage_System SHALL upload the file to Supabase_Storage within 5 seconds
2. WHEN a file upload completes successfully, THE Tutor_Onboarding_Form SHALL display a visual confirmation indicator
3. WHEN a file upload fails, THE Tutor_Onboarding_Form SHALL display an error message and allow retry
4. THE Draft_Storage_System SHALL accept files up to 5MB for documents and 100MB for videos
5. WHEN uploading a Draft_File, THE Draft_Storage_System SHALL associate it with the user's Clerk_ID
6. THE Draft_Storage_System SHALL store Draft_Files in a dedicated storage bucket separate from final submissions

### Requirement 2: Draft File Storage Structure

**User Story:** As a system administrator, I want draft files organized by user and file type, so that they can be efficiently managed and retrieved.

#### Acceptance Criteria

1. THE Draft_Storage_System SHALL store Draft_Files in Supabase_Storage using the path pattern: `drafts/{clerk_id}/{file_type}/{timestamp}_{filename}`
2. THE Draft_Storage_System SHALL support five file types: `degree_certificate`, `government_id`, `nysc_certificate`, `profile_photo`, and `intro_video`
3. THE Draft_Storage_System SHALL generate unique filenames using timestamp and original filename to prevent collisions
4. THE Draft_Storage_System SHALL store Draft_Metadata in a database table with fields: id, clerk_user_id, file_type, storage_path, original_filename, file_size, uploaded_at, expires_at
5. WHEN a Draft_File is uploaded, THE Draft_Storage_System SHALL set expires_at to 30 days from upload time

### Requirement 3: Draft File Restoration

**User Story:** As a tutor returning to the onboarding form, I want to see my previously uploaded files automatically restored, so that I can continue where I left off.

#### Acceptance Criteria

1. WHEN a tutor loads the Tutor_Onboarding_Form, THE Draft_Storage_System SHALL query for Draft_Files associated with their Clerk_ID
2. WHEN Draft_Files exist for a user, THE Tutor_Onboarding_Form SHALL display file names and preview thumbnails for each uploaded file
3. WHEN Draft_Files exist for a user, THE Tutor_Onboarding_Form SHALL populate the form state with file references
4. THE Draft_Storage_System SHALL retrieve Draft_Metadata within 2 seconds of form load
5. WHEN displaying restored files, THE Tutor_Onboarding_Form SHALL show the original filename and upload date

### Requirement 4: Draft File Replacement

**User Story:** As a tutor, I want to replace a previously uploaded file with a new one, so that I can correct mistakes or update my documents.

#### Acceptance Criteria

1. WHEN a tutor uploads a new file for a file type that already has a Draft_File, THE Draft_Storage_System SHALL upload the new file
2. WHEN a new file upload succeeds, THE Draft_Storage_System SHALL delete the previous Draft_File from Supabase_Storage
3. WHEN a new file upload succeeds, THE Draft_Storage_System SHALL update the Draft_Metadata record with the new file information
4. IF the new file upload fails, THE Draft_Storage_System SHALL preserve the existing Draft_File
5. THE Draft_Storage_System SHALL complete the replacement operation atomically to prevent data loss

### Requirement 5: Draft Cleanup on Submission

**User Story:** As a tutor, I want my draft files to be moved to permanent storage when I submit my application, so that they are preserved as part of my profile.

#### Acceptance Criteria

1. WHEN a tutor successfully submits the Tutor_Onboarding_Form, THE Draft_Storage_System SHALL move all Draft_Files to permanent storage locations
2. WHEN moving files to permanent storage, THE Draft_Storage_System SHALL update the tutors table with the permanent file URLs
3. WHEN files are moved to permanent storage, THE Draft_Storage_System SHALL delete the Draft_Metadata records
4. IF the submission process fails, THE Draft_Storage_System SHALL preserve all Draft_Files and Draft_Metadata
5. THE Draft_Storage_System SHALL complete the submission cleanup within 10 seconds

### Requirement 6: Automatic Draft Expiration

**User Story:** As a system administrator, I want unused draft files to be automatically deleted after 30 days, so that storage costs are minimized and orphaned files are removed.

#### Acceptance Criteria

1. THE Cleanup_Job SHALL run daily at 2:00 AM UTC
2. WHEN the Cleanup_Job runs, THE Draft_Storage_System SHALL identify all Draft_Metadata records where expires_at is before the current time
3. WHEN expired Draft_Files are identified, THE Draft_Storage_System SHALL delete the files from Supabase_Storage
4. WHEN expired Draft_Files are deleted, THE Draft_Storage_System SHALL delete the corresponding Draft_Metadata records
5. THE Cleanup_Job SHALL log the number of files deleted and any errors encountered
6. IF a file deletion fails, THE Cleanup_Job SHALL continue processing remaining files and retry failed deletions on the next run

### Requirement 7: Draft File Security

**User Story:** As a tutor, I want my uploaded documents to be secure and only accessible to me and authorized administrators, so that my personal information is protected.

#### Acceptance Criteria

1. THE Draft_Storage_System SHALL enforce Row Level Security policies ensuring users can only access their own Draft_Files
2. WHEN a user requests a Draft_File, THE Draft_Storage_System SHALL verify the Clerk_ID matches the file owner
3. THE Draft_Storage_System SHALL generate signed URLs with 1-hour expiration for file downloads
4. THE Draft_Storage_System SHALL reject requests to access Draft_Files without valid authentication
5. THE Draft_Storage_System SHALL use HTTPS for all file upload and download operations

### Requirement 8: API Endpoints for Draft Management

**User Story:** As a frontend developer, I want clear API endpoints for managing draft files, so that I can integrate the functionality into the onboarding form.

#### Acceptance Criteria

1. THE Draft_Storage_System SHALL provide a POST endpoint `/api/drafts/upload` that accepts multipart form data with fields: file, fileType, clerkUserId
2. THE Draft_Storage_System SHALL provide a GET endpoint `/api/drafts/{clerkUserId}` that returns all Draft_Metadata for a user
3. THE Draft_Storage_System SHALL provide a DELETE endpoint `/api/drafts/{clerkUserId}/{fileType}` that removes a specific Draft_File
4. THE Draft_Storage_System SHALL provide a GET endpoint `/api/drafts/download/{draftId}` that returns a signed URL for file access
5. WHEN an API endpoint receives invalid parameters, THE Draft_Storage_System SHALL return a 400 status code with error details
6. WHEN an API endpoint encounters a server error, THE Draft_Storage_System SHALL return a 500 status code and log the error
7. THE Draft_Storage_System SHALL return appropriate HTTP status codes: 200 for success, 201 for creation, 404 for not found, 401 for unauthorized

### Requirement 9: Database Schema for Draft Metadata

**User Story:** As a database administrator, I want a well-structured schema for tracking draft files, so that data integrity is maintained and queries are efficient.

#### Acceptance Criteria

1. THE Draft_Storage_System SHALL create a table named `tutor_onboarding_drafts` with columns: id (UUID primary key), clerk_user_id (TEXT not null), file_type (TEXT not null), storage_path (TEXT not null), original_filename (TEXT not null), file_size (INTEGER not null), mime_type (TEXT not null), uploaded_at (TIMESTAMP not null), expires_at (TIMESTAMP not null)
2. THE Draft_Storage_System SHALL create an index on clerk_user_id for efficient user queries
3. THE Draft_Storage_System SHALL create an index on expires_at for efficient cleanup queries
4. THE Draft_Storage_System SHALL create a unique constraint on (clerk_user_id, file_type) to prevent duplicate file types per user
5. THE Draft_Storage_System SHALL add a foreign key constraint referencing profiles(clerk_user_id) with ON DELETE CASCADE

### Requirement 10: Error Handling and User Feedback

**User Story:** As a tutor, I want clear feedback when file uploads succeed or fail, so that I know the status of my application progress.

#### Acceptance Criteria

1. WHEN a file upload is in progress, THE Tutor_Onboarding_Form SHALL display a progress indicator showing upload percentage
2. WHEN a file upload succeeds, THE Tutor_Onboarding_Form SHALL display a success message with a checkmark icon for 3 seconds
3. WHEN a file upload fails due to network issues, THE Tutor_Onboarding_Form SHALL display an error message and a retry button
4. WHEN a file upload fails due to file size limits, THE Tutor_Onboarding_Form SHALL display an error message specifying the size limit
5. WHEN a file upload fails due to invalid file type, THE Tutor_Onboarding_Form SHALL display an error message listing accepted file types
6. THE Tutor_Onboarding_Form SHALL allow users to dismiss error messages manually

### Requirement 11: Performance Requirements

**User Story:** As a tutor with slow internet, I want file uploads to be efficient and resumable, so that I can complete the onboarding process despite connectivity issues.

#### Acceptance Criteria

1. THE Draft_Storage_System SHALL complete uploads of files under 5MB within 10 seconds on a 5 Mbps connection
2. THE Draft_Storage_System SHALL complete uploads of video files up to 100MB within 3 minutes on a 5 Mbps connection
3. THE Draft_Storage_System SHALL support chunked uploads for files larger than 10MB
4. WHEN a chunked upload is interrupted, THE Draft_Storage_System SHALL allow resumption from the last completed chunk
5. THE Tutor_Onboarding_Form SHALL remain responsive during file uploads and not block user interaction

### Requirement 12: File Type Validation

**User Story:** As a system administrator, I want uploaded files to be validated for type and content, so that only appropriate documents are stored.

#### Acceptance Criteria

1. THE Draft_Storage_System SHALL accept image files (JPEG, PNG, HEIC, WebP) for profile_photo with maximum size 5MB
2. THE Draft_Storage_System SHALL accept document files (PDF, JPEG, PNG) for degree_certificate, government_id, and nysc_certificate with maximum size 5MB each
3. THE Draft_Storage_System SHALL accept video files (MP4, WebM, MOV) for intro_video with maximum size 100MB
4. WHEN a file is uploaded, THE Draft_Storage_System SHALL verify the file MIME type matches the file extension
5. WHEN a file fails validation, THE Draft_Storage_System SHALL return a 400 error with a descriptive message
6. THE Draft_Storage_System SHALL reject files with executable extensions (.exe, .sh, .bat, .js, .py)

### Requirement 13: Integration with Existing Form State

**User Story:** As a frontend developer, I want draft file storage to integrate seamlessly with the existing localStorage form state, so that minimal code changes are required.

#### Acceptance Criteria

1. WHEN a Draft_File is uploaded, THE Tutor_Onboarding_Form SHALL store a reference object in localStorage containing: draftId, filename, uploadedAt, fileType
2. WHEN the form loads, THE Tutor_Onboarding_Form SHALL check localStorage for draft file references before querying the server
3. WHEN draft file references exist in localStorage, THE Tutor_Onboarding_Form SHALL validate they still exist on the server
4. IF a draft file reference in localStorage no longer exists on the server, THE Tutor_Onboarding_Form SHALL remove the reference and prompt the user to re-upload
5. THE Tutor_Onboarding_Form SHALL clear draft file references from localStorage when the application is successfully submitted

### Requirement 14: Monitoring and Logging

**User Story:** As a system administrator, I want comprehensive logging of draft file operations, so that I can troubleshoot issues and monitor system health.

#### Acceptance Criteria

1. THE Draft_Storage_System SHALL log all file upload attempts with: timestamp, clerk_user_id, file_type, file_size, success/failure status
2. THE Draft_Storage_System SHALL log all file deletion operations with: timestamp, clerk_user_id, file_type, reason (user_replaced, submission_cleanup, expiration)
3. THE Draft_Storage_System SHALL log Cleanup_Job execution with: start_time, end_time, files_deleted_count, errors_count
4. WHEN an error occurs, THE Draft_Storage_System SHALL log the full error stack trace and request context
5. THE Draft_Storage_System SHALL expose metrics for: total_draft_files, total_storage_used, average_upload_time, upload_failure_rate
6. THE Draft_Storage_System SHALL send alerts when upload_failure_rate exceeds 10% over a 1-hour period
