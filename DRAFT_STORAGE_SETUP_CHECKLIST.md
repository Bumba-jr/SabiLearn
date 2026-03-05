# Draft Storage Setup Checklist

Use this checklist to set up and deploy the draft storage feature.

## Prerequisites

- [ ] Supabase project is set up and running
- [ ] Clerk authentication is configured
- [ ] Next.js application is deployed on Vercel (or ready to deploy)

## Database Setup

- [ ] Run the migration: `supabase/migrations/003_tutor_onboarding_drafts_storage.sql`
  ```bash
  # Using Supabase CLI
  supabase migration up
  
  # Or apply manually in Supabase Dashboard > SQL Editor
  ```

- [ ] Verify the table was created:
  ```sql
  SELECT * FROM tutor_onboarding_drafts LIMIT 1;
  ```

- [ ] Verify RLS policies are active:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'tutor_onboarding_drafts';
  ```

## Storage Setup

- [ ] Create the 'drafts' storage bucket in Supabase Dashboard
  - Go to Storage > Create bucket
  - Name: `drafts`
  - Public: `No` (private bucket)
  - File size limit: `100MB`

- [ ] Configure storage policies (see `supabase/DRAFT_STORAGE_SETUP.md`)
  - Policy 1: Users can upload to their own folder
  - Policy 2: Users can read their own files
  - Policy 3: Users can delete their own files

- [ ] Test storage access:
  ```bash
  # Upload a test file via Supabase Dashboard
  # Verify it appears in the bucket
  ```

## Environment Variables

- [ ] Generate admin API key:
  ```bash
  openssl rand -base64 32
  ```

- [ ] Add to `.env.local`:
  ```env
  ADMIN_API_KEY=<generated_key>
  ```

- [ ] Add to Vercel environment variables:
  - Go to Vercel Dashboard > Project > Settings > Environment Variables
  - Add `ADMIN_API_KEY` with the same value
  - Apply to: Production, Preview, Development

- [ ] Verify all required environment variables are set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] `CLERK_SECRET_KEY`
  - [ ] `ADMIN_API_KEY` (new)

## Code Integration

- [ ] Review integration guide: `app/onboarding/tutor/TutorOnboardingWithDrafts.tsx`

- [ ] Integrate draft storage into tutor onboarding form:
  - [ ] Add draft state management
  - [ ] Replace Step 4 file inputs with `DraftFileInput` components
  - [ ] Replace Step 5 profile photo input with `DraftFileInput`
  - [ ] Add draft restoration on page load
  - [ ] Add `clearAllDraftReferences()` to form submission

- [ ] Test locally:
  ```bash
  npm run dev
  # Navigate to /onboarding/tutor
  # Test file upload
  # Refresh page and verify draft restoration
  ```

## Testing

- [ ] Test file upload:
  - [ ] Upload degree certificate (PDF, 5MB)
  - [ ] Upload government ID (JPG, 5MB)
  - [ ] Upload NYSC certificate (PNG, 5MB)
  - [ ] Upload profile photo (JPG, 5MB)
  - [ ] Upload intro video (MP4, 100MB)

- [ ] Test file validation:
  - [ ] Try uploading oversized file (should fail)
  - [ ] Try uploading wrong file type (should fail)
  - [ ] Try uploading executable file (should fail)

- [ ] Test draft restoration:
  - [ ] Upload files
  - [ ] Refresh page
  - [ ] Verify drafts are restored
  - [ ] Verify file previews work

- [ ] Test file replacement:
  - [ ] Upload a file
  - [ ] Upload a different file for the same type
  - [ ] Verify old file is deleted
  - [ ] Verify new file is stored

- [ ] Test form submission:
  - [ ] Complete entire form
  - [ ] Submit form
  - [ ] Verify drafts are cleared from localStorage
  - [ ] Verify user is redirected to dashboard

- [ ] Test API endpoints:
  ```bash
  # Upload
  curl -X POST http://localhost:3000/api/drafts/upload \
    -F "file=@test.pdf" \
    -F "fileType=degree_certificate" \
    -F "clerkUserId=user_123"
  
  # Retrieve
  curl http://localhost:3000/api/drafts/user_123
  
  # Delete
  curl -X DELETE http://localhost:3000/api/drafts/user_123/degree_certificate
  
  # Cleanup (use actual ADMIN_API_KEY)
  curl -X POST http://localhost:3000/api/drafts/cleanup \
    -H "Authorization: Bearer $ADMIN_API_KEY"
  ```

## Deployment

- [ ] Deploy to Vercel:
  ```bash
  vercel --prod
  ```

- [ ] Verify cron job is configured:
  ```bash
  vercel crons ls
  ```
  
  Expected output:
  ```
  Path: /api/drafts/cleanup
  Schedule: 0 2 * * *
  ```

- [ ] Test production deployment:
  - [ ] Navigate to production URL
  - [ ] Test file upload
  - [ ] Test draft restoration
  - [ ] Test form submission

- [ ] Monitor first cleanup job execution:
  - [ ] Wait for 2:00 AM UTC (or trigger manually)
  - [ ] Check Vercel logs for cleanup job execution
  - [ ] Verify expired drafts are deleted

## Monitoring Setup

- [ ] Set up error monitoring (optional):
  - [ ] Sentry integration
  - [ ] LogRocket integration
  - [ ] Custom logging service

- [ ] Set up storage monitoring:
  - [ ] Monitor Supabase Storage usage
  - [ ] Set up alerts for high storage usage
  - [ ] Track cleanup job success rate

- [ ] Set up performance monitoring:
  - [ ] Monitor API response times
  - [ ] Track upload success rates
  - [ ] Monitor file sizes and types

## Documentation

- [ ] Review API documentation: `docs/api/draft-storage.md`
- [ ] Review developer guide: `docs/draft-storage-guide.md`
- [ ] Review setup instructions: `supabase/DRAFT_STORAGE_SETUP.md`
- [ ] Review implementation summary: `DRAFT_STORAGE_IMPLEMENTATION.md`

## Post-Deployment

- [ ] Create test user account
- [ ] Complete full onboarding flow as test user
- [ ] Verify all files are uploaded correctly
- [ ] Verify drafts are restored on page refresh
- [ ] Verify form submission clears drafts
- [ ] Monitor logs for first 24 hours
- [ ] Check cleanup job runs successfully

## Rollback Plan (if needed)

If issues arise, you can rollback by:

1. [ ] Revert code changes to previous version
2. [ ] Keep database table (data is safe)
3. [ ] Keep storage bucket (files are safe)
4. [ ] Disable cron job in Vercel
5. [ ] Remove ADMIN_API_KEY from environment variables

## Success Criteria

- [x] All database migrations applied successfully
- [x] Storage bucket created and configured
- [x] All API endpoints working correctly
- [x] Frontend components integrated
- [x] File upload and restoration working
- [x] Cron job configured and running
- [x] Documentation complete
- [ ] Production deployment successful
- [ ] No critical errors in logs
- [ ] Users can complete onboarding with draft storage

## Support

If you encounter issues:

1. Check the logs in Vercel Dashboard
2. Review error messages in browser console
3. Check Supabase logs for database/storage errors
4. Review documentation in `docs/` folder
5. Test API endpoints manually with curl
6. Verify environment variables are set correctly

## Notes

- Draft files expire after 30 days
- Cleanup job runs daily at 2:00 AM UTC
- Maximum file sizes: 5MB (documents), 100MB (videos)
- Supported file types: PDF, JPG, PNG, HEIC, MP4, WEBM, MOV
- Files are stored in private Supabase Storage bucket
- Signed URLs expire after 1 hour

---

**Last Updated:** [Current Date]
**Status:** Ready for deployment
**Estimated Setup Time:** 2-3 hours
