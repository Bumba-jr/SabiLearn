# Implementation Plan: Tutor Onboarding Draft Storage

## Overview

This implementation plan breaks down the tutor onboarding draft storage feature into discrete coding tasks. The feature enables automatic server-side storage of uploaded files during the tutor onboarding process, allowing tutors to complete their application across multiple sessions without losing file uploads.

The implementation follows a bottom-up approach: database schema → backend utilities → API endpoints → frontend hooks → frontend components → integration → testing.

## Tasks

- [ ] 1. Database schema and storage setup
  - [x] 1.1 Create database migration for tutor_onboarding_drafts table
    - Create migration file `supabase/migrations/003_tutor_onboarding_drafts.sql`
    - Define table with columns: id, clerk_user_id, file_type, storage_path, original_filename, file_size, mime_type, uploaded_at, expires_at
    - Add CHECK constraint for file_type enum (degree_certificate, government_id, nysc_certificate, profile_photo, intro_video)
    - Add UNIQUE constraint on (clerk_user_id, file_type)
    - Add foreign key to profiles(clerk_user_id) with ON DELETE CASCADE
    - Create indexes on clerk_user_id, expires_at, and file_type
    - Enable Row Level Security (RLS)
    - Create RLS policies for SELECT, INSERT, UPDATE, DELETE (user can only access own drafts)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 7.1_
  
  - [x] 1.2 Create Supabase Storage bucket and policies
    - Create storage bucket named 'drafts' (private)
    - Set file size limit to 100MB
    - Create storage policy: users can upload to their own folder (drafts/{clerk_id}/*)
    - Create storage policy: users can read their own files
    - Create storage policy: users can delete their own files
    - _Requirements: 1.6, 7.1, 7.5_

- [ ] 2. Backend utilities and validation
  - [x] 2.1 Create file validation utility
    - Create `lib/utils/file-validation.ts`
    - Define FILE_VALIDATION_RULES constant with rules for each file type (maxSize, acceptedMimeTypes, acceptedExtensions)
    - Implement validateFileType function (checks file type is one of 5 supported types)
    - Implement validateFileSize function (checks size limits: 5MB for documents/photos, 100MB for videos)
    - Implement validateMimeType function (verifies MIME type matches extension)
    - Implement rejectExecutableFiles function (blocks .exe, .sh, .bat, .js, .py)
    - Implement validateFile function that combines all validations and returns descriptive errors
    - _Requirements: 1.4, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ]* 2.2 Write property tests for file validation
    - **Property 3: File Type Validation**
    - **Property 4: File Size Validation by Type**
    - **Property 5: MIME Type and Extension Validation**
    - **Property 6: Executable File Rejection**
    - **Validates: Requirements 2.2, 1.4, 12.1-12.6**
  
  - [x] 2.3 Create storage path utility
    - Create `lib/utils/storage-path.ts`
    - Implement generateStoragePath function: `drafts/{clerk_id}/{file_type}/{timestamp}_{sanitized_filename}`
    - Implement sanitizeFilename function (remove special characters, preserve extension)
    - Implement parseStoragePath function (extract clerk_id, file_type from path)
    - _Requirements: 2.1, 2.3_
  
  - [ ]* 2.4 Write property tests for storage path generation
    - **Property 2: Storage Path Format Consistency**
    - **Property 7: Filename Uniqueness**
    - **Validates: Requirements 2.1, 2.3**

- [ ] 3. Database operations layer
  - [x] 3.1 Create draft metadata database operations
    - Create `lib/db/draft-operations.ts`
    - Implement createDraftMetadata function (inserts record with expires_at = now() + 30 days)
    - Implement getDraftsByUserId function (queries all drafts for a user)
    - Implement getDraftById function (queries single draft with ownership check)
    - Implement updateDraftMetadata function (updates existing draft record)
    - Implement deleteDraftMetadata function (deletes single draft record)
    - Implement deleteAllUserDrafts function (deletes all drafts for a user)
    - Implement getExpiredDrafts function (queries drafts where expires_at < now())
    - _Requirements: 2.4, 2.5, 3.1, 6.2_
  
  - [ ]* 3.2 Write property tests for draft metadata operations
    - **Property 1: File Upload Creates Complete Metadata**
    - **Property 12: Unique File Type Per User**
    - **Property 15: Expired Draft Identification**
    - **Validates: Requirements 1.5, 2.4, 2.5, 9.4, 6.2**

- [x] 4. Supabase Storage operations layer
  - [x] 4.1 Create storage operations utility
    - Create `lib/storage/draft-storage.ts`
    - Implement uploadDraftFile function (uploads file to Supabase Storage, returns storage_path)
    - Implement deleteDraftFile function (deletes file from storage by path)
    - Implement generateSignedUrl function (creates 1-hour signed URL for file access)
    - Implement moveDraftToPermanent function (copies file from drafts/ to permanent location, deletes draft)
    - Implement fileExists function (checks if file exists in storage)
    - _Requirements: 1.1, 5.1, 7.3_
  
  - [x]* 4.2 Write unit tests for storage operations
    - Test uploadDraftFile with valid files
    - Test deleteDraftFile removes files
    - Test generateSignedUrl creates valid URLs
    - Test moveDraftToPermanent copies and deletes correctly
    - _Requirements: 1.1, 5.1, 7.3_

- [x] 5. API endpoint: POST /api/drafts/upload
  - [x] 5.1 Implement draft upload endpoint
    - Create `app/api/drafts/upload/route.ts`
    - Verify Clerk authentication (return 401 if not authenticated)
    - Parse multipart form data (file, fileType, clerkUserId)
    - Validate clerkUserId matches authenticated user (return 403 if mismatch)
    - Validate file using file-validation utility (return 400 with descriptive error)
    - Check if draft already exists for this file_type
    - If exists: begin transaction → upload new file → update metadata → delete old file → commit
    - If new: upload file → create metadata record
    - Return 201 with draft metadata on success
    - Handle errors: rollback transaction, cleanup uploaded files, return appropriate status codes
    - _Requirements: 1.1, 1.3, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.5, 8.6_
  
  - [ ]* 5.2 Write property tests for upload endpoint
    - **Property 10: Atomic File Replacement**
    - **Property 11: Failed Upload Preservation**
    - **Property 20: HTTP Status Code Semantics**
    - **Property 23: Upload Error Handling**
    - **Validates: Requirements 4.1-4.5, 8.5, 8.6, 1.3**
  
  - [x]* 5.3 Write unit tests for upload endpoint
    - Test successful upload creates metadata
    - Test file replacement deletes old file
    - Test validation errors return 400
    - Test unauthorized access returns 401/403
    - Test transaction rollback on failure
    - _Requirements: 1.1, 4.1-4.5, 8.1_

- [x] 6. API endpoint: GET /api/drafts/[clerkUserId]
  - [x] 6.1 Implement draft retrieval endpoint
    - Create `app/api/drafts/[clerkUserId]/route.ts`
    - Verify Clerk authentication (return 401 if not authenticated)
    - Validate clerkUserId matches authenticated user (return 403 if mismatch)
    - Query all drafts for user using getDraftsByUserId
    - Return 200 with array of draft metadata (return empty array if none found)
    - Handle errors: return 500 with error message
    - _Requirements: 3.1, 7.1, 7.2, 8.2, 8.7_
  
  - [ ]* 6.2 Write property tests for retrieval endpoint
    - **Property 8: User-Scoped Draft Retrieval**
    - **Property 18: Unauthorized Access Rejection**
    - **Validates: Requirements 3.1, 7.1, 7.2, 7.4_
  
  - [x]* 6.3 Write unit tests for retrieval endpoint
    - Test returns only user's drafts
    - Test returns empty array when no drafts
    - Test rejects unauthorized access
    - _Requirements: 3.1, 7.2, 8.2_

- [x] 7. API endpoint: DELETE /api/drafts/[clerkUserId]/[fileType]
  - [x] 7.1 Implement draft deletion endpoint
    - Create `app/api/drafts/[clerkUserId]/[fileType]/route.ts`
    - Verify Clerk authentication (return 401 if not authenticated)
    - Validate clerkUserId matches authenticated user (return 403 if mismatch)
    - Query draft metadata for user and file_type
    - If not found, return 404
    - Begin transaction → delete file from storage → delete metadata record → commit
    - Return 200 with success message
    - Handle errors: rollback transaction, return 500
    - _Requirements: 7.2, 8.3, 8.7_
  
  - [x]* 7.2 Write unit tests for deletion endpoint
    - Test successful deletion removes file and metadata
    - Test returns 404 when draft doesn't exist
    - Test rejects unauthorized access
    - Test transaction rollback on storage error
    - _Requirements: 7.2, 8.3_

- [x] 8. API endpoint: GET /api/drafts/download/[draftId]
  - [x] 8.1 Implement draft download endpoint
    - Create `app/api/drafts/download/[draftId]/route.ts`
    - Verify Clerk authentication (return 401 if not authenticated)
    - Query draft metadata by draftId
    - If not found, return 404
    - Validate clerkUserId matches authenticated user (return 403 if mismatch)
    - Generate signed URL with 1-hour expiration using generateSignedUrl
    - Return 200 with { signedUrl, expiresIn: 3600 }
    - Handle errors: return 500
    - _Requirements: 7.2, 7.3, 8.4, 8.7_
  
  - [ ]* 8.2 Write property tests for download endpoint
    - **Property 19: Signed URL Expiration**
    - **Validates: Requirements 7.3**
  
  - [x]* 8.3 Write unit tests for download endpoint
    - Test generates valid signed URL
    - Test rejects unauthorized access
    - Test returns 404 for non-existent draft
    - _Requirements: 7.2, 7.3, 8.4_

- [x] 9. API endpoint: POST /api/drafts/cleanup
  - [x] 9.1 Implement cleanup job endpoint
    - Create `app/api/drafts/cleanup/route.ts`
    - Verify admin API key from request headers (return 401 if invalid)
    - Query expired drafts using getExpiredDrafts
    - For each expired draft: delete file from storage → delete metadata record
    - Continue processing on individual failures (don't abort entire batch)
    - Track deletedCount and errorCount
    - Log each deletion with clerk_user_id, file_type, reason: 'expiration'
    - Return 200 with { deletedCount, errorCount, executionTimeMs }
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 9.2 Write property tests for cleanup job
    - **Property 16: Cleanup Deletes Files and Metadata**
    - **Property 17: Cleanup Error Resilience**
    - **Validates: Requirements 6.3, 6.4, 6.6**
  
  - [x]* 9.3 Write unit tests for cleanup job
    - Test deletes expired drafts
    - Test continues on individual failures
    - Test logs deletions correctly
    - Test rejects invalid API key
    - _Requirements: 6.2-6.6_

- [ ] 10. Checkpoint - Ensure backend tests pass
  - Run all backend unit tests and property tests
  - Verify API endpoints return correct status codes
  - Ensure all tests pass, ask the user if questions arise

- [x] 11. Frontend hook: useDraftFileUpload
  - [x] 11.1 Create draft file upload hook
    - Create `hooks/useDraftFileUpload.ts`
    - Accept options: { fileType, onSuccess, onError }
    - Implement upload function: creates FormData, POSTs to /api/drafts/upload, tracks progress
    - Manage state: isUploading, progress (0-100), error
    - On success: store draft reference in localStorage { draftId, filename, uploadedAt, fileType }, call onSuccess callback
    - On error: set error state, call onError callback
    - Implement clearError function
    - Return { upload, isUploading, progress, error, clearError }
    - _Requirements: 1.1, 1.2, 10.1, 13.1_
  
  - [x]* 11.2 Write unit tests for useDraftFileUpload hook
    - Test upload function sends correct FormData
    - Test progress tracking updates correctly
    - Test success updates localStorage
    - Test error handling sets error state
    - Test clearError clears error
    - _Requirements: 1.1, 1.2, 10.1, 13.1_

- [x] 12. Frontend component: DraftFileInput
  - [x] 12.1 Create draft file input component
    - Create `components/onboarding/DraftFileInput.tsx`
    - Accept props: fileType, accept, maxSize, label, description, value, draftMetadata, onChange, onDraftRestore
    - Integrate useDraftFileUpload hook
    - Render file input with drag-and-drop support
    - Display upload progress indicator when uploading
    - Display success message with checkmark for 3 seconds after upload
    - Display error message with retry button on failure
    - Display file preview for images/videos
    - Display draft restoration UI if draftMetadata provided (show filename, upload date, "Replace" button)
    - Handle file selection: validate client-side, call upload function
    - On successful upload: call onChange with file, call onDraftRestore if provided
    - Allow manual error dismissal
    - _Requirements: 1.2, 1.3, 3.2, 3.5, 10.1, 10.2, 10.3, 10.6_
  
  - [ ]* 12.2 Write unit tests for DraftFileInput component
    - Test renders file input correctly
    - Test displays upload progress
    - Test displays success message
    - Test displays error message with retry
    - Test draft restoration UI
    - Test file preview rendering
    - _Requirements: 1.2, 1.3, 3.2, 10.1-10.3_

- [x] 13. Frontend utility: Draft restoration
  - [x] 13.1 Create draft restoration utility
    - Create `lib/utils/draft-restoration.ts`
    - Implement loadDraftsFromLocalStorage function (reads draft references from localStorage)
    - Implement validateDraftsWithServer function (queries /api/drafts/{clerkUserId}, compares with localStorage)
    - Implement cleanupStaleDraftReferences function (removes localStorage entries that don't exist on server)
    - Implement clearAllDraftReferences function (removes all draft references from localStorage)
    - _Requirements: 13.2, 13.3, 13.4, 13.5_
  
  - [ ]* 13.2 Write property tests for draft restoration
    - **Property 21: localStorage Synchronization**
    - **Property 22: Stale Reference Cleanup**
    - **Validates: Requirements 13.1, 13.3, 13.4, 13.5**

- [ ] 14. Modify tutor onboarding form
  - [ ] 14.1 Integrate draft storage into onboarding form
    - Modify `app/onboarding/tutor/page.tsx`
    - Add state for draft metadata: `const [draftMetadata, setDraftMetadata] = useState<Record<FileType, DraftMetadata | null>>({})`
    - On component mount: call loadDraftsFromLocalStorage, then validateDraftsWithServer
    - For each restored draft: fetch signed URL using /api/drafts/download/{draftId}, update form state
    - Replace file input fields with DraftFileInput components for: degreeCertificate, governmentId, nyscCertificate, profilePhoto, introVideo
    - Pass appropriate props to each DraftFileInput (fileType, accept, maxSize, label, value, draftMetadata, onChange)
    - Handle draft restoration: when draft exists, populate form state and display preview
    - Display loading state while restoring drafts
    - Show warning if draft restoration fails (but allow form to continue)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 13.2, 13.3_
  
  - [ ] 14.2 Modify form submission to handle draft cleanup
    - In handleSubmit function, after successful API response:
    - Call clearAllDraftReferences to remove localStorage entries
    - Note: Backend will handle moving drafts to permanent storage (not implemented in this feature)
    - _Requirements: 13.5_
  
  - [ ]* 14.3 Write integration tests for form with draft storage
    - Test form loads and restores drafts
    - Test file upload creates draft
    - Test file replacement updates draft
    - Test form submission clears draft references
    - Test stale draft cleanup
    - _Requirements: 3.1-3.5, 13.1-13.5_

- [ ] 15. Checkpoint - Ensure frontend tests pass
  - Run all frontend unit tests and integration tests
  - Verify draft restoration works correctly
  - Verify file uploads create drafts
  - Ensure all tests pass, ask the user if questions arise

- [x] 16. Setup cleanup cron job
  - [x] 16.1 Configure Vercel cron job for cleanup
    - Create `vercel.json` with cron configuration (daily at 2:00 AM UTC)
    - Configure cron to call POST /api/drafts/cleanup with admin API key
    - Add ADMIN_API_KEY to environment variables
    - Document cron setup in README or deployment docs
    - _Requirements: 6.1_
  
  - [ ]* 16.2 Test cleanup job manually
    - Create test expired drafts in database
    - Manually trigger cleanup endpoint
    - Verify expired drafts are deleted
    - Verify logs are created
    - _Requirements: 6.1-6.6_

- [x] 17. Error handling and logging
  - [x] 17.1 Add comprehensive error logging
    - Create `lib/utils/error-logger.ts`
    - Implement logError function with structured logging (timestamp, level, category, userId, fileType, errorMessage, errorStack, requestId, metadata)
    - Integrate error logging into all API endpoints
    - Log all upload attempts (success/failure)
    - Log all deletion operations (user_replaced, submission_cleanup, expiration)
    - Log cleanup job execution (start_time, end_time, files_deleted_count, errors_count)
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ]* 17.2 Write unit tests for error logging
    - Test logError creates correct log structure
    - Test logs include all required fields
    - Test different error categories
    - _Requirements: 14.1-14.4_

- [ ] 18. Property-based test setup
  - [ ] 18.1 Create test fixtures and arbitraries
    - Create `tests/fixtures/arbitraries.ts`
    - Implement fileTypeArbitrary (generates random valid file types)
    - Implement validFileArbitrary (generates valid test files)
    - Implement invalidFileSizeArbitrary (generates oversized files)
    - Implement clerkUserIdArbitrary (generates valid Clerk IDs)
    - Implement draftMetadataArbitrary (generates valid draft metadata)
    - Create test files in `tests/fixtures/test-files/` (valid-pdf.pdf, valid-image.jpg, valid-video.mp4, oversized-file.pdf, invalid-executable.exe)
    - _Requirements: All property tests_
  
  - [ ] 18.2 Configure fast-check for property tests
    - Install fast-check: `npm install --save-dev fast-check`
    - Configure test runner (Jest/Vitest) for property tests
    - Set minimum 100 iterations per property test
    - Enable seed-based reproducibility
    - Enable shrinking for minimal failing examples
    - _Requirements: All property tests_

- [x] 19. Documentation
  - [x] 19.1 Create API documentation
    - Document all API endpoints in `docs/api/draft-storage.md`
    - Include request/response examples
    - Document error codes and messages
    - Document authentication requirements
    - _Requirements: 8.1-8.7_
  
  - [x] 19.2 Create developer guide
    - Document draft storage architecture in `docs/draft-storage-guide.md`
    - Explain file upload flow
    - Explain draft restoration flow
    - Explain cleanup job
    - Include code examples for common use cases
    - _Requirements: All_

- [ ] 20. Final checkpoint - End-to-end testing
  - Manually test complete user flow: upload files → refresh page → verify restoration → submit form → verify cleanup
  - Test file replacement flow
  - Test error scenarios (network errors, validation errors, unauthorized access)
  - Verify cleanup job deletes expired drafts
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate complete workflows
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows a bottom-up approach: database → backend → frontend → integration
- All file operations use transactions to ensure atomicity and prevent data loss
- Draft files expire after 30 days and are automatically cleaned up by the cron job
- localStorage is used for client-side caching but server is the source of truth
