# Draft Storage Integration Checklist

Use this checklist to track your progress as you integrate draft storage.

## Pre-Integration Setup

- [ ] **Database Migration Applied**
  - Go to Supabase Dashboard → SQL Editor
  - Run `supabase/migrations/003_tutor_onboarding_drafts_storage.sql`
  - Verify table created: `SELECT * FROM tutor_onboarding_drafts LIMIT 1;`

- [ ] **Storage Bucket Created**
  - Go to Supabase Dashboard → Storage
  - Create bucket: `drafts` (private, 100MB limit)
  - Apply 3 RLS policies from `supabase/DRAFT_STORAGE_SETUP.md`

- [ ] **Environment Variable Set**
  - ✅ `.env.local` has `ADMIN_API_KEY=zXN4tqeZMyh7qqYr7RznT2qStxH9EyVL5GNrNzOT2Ds=`
  - [ ] Add same key to Vercel when deploying

## Code Integration (app/onboarding/tutor/page.tsx)

Follow `INTEGRATION_GUIDE_STEP_BY_STEP.md` for detailed instructions.

### Change 1: Imports (Line ~6)
- [ ] Add `DraftFileInput` import
- [ ] Add draft restoration utilities import
- [ ] Add type imports from `draft-operations`

### Change 2: State Variables (Line ~220)
- [ ] Add `draftMetadata` state
- [ ] Add `isLoadingDrafts` state
- [ ] Add `draftError` state

### Change 3: Draft Loading Effect (Line ~300)
- [ ] Add `useEffect` for loading drafts
- [ ] Includes `validateDraftsWithServer` call
- [ ] Includes `cleanupStaleDraftReferences` call

### Change 4: Helper Function (Line ~350)
- [ ] Add `handleDraftRestore` function

### Change 5: Step 4 File Inputs (Line ~950-1050)
- [ ] Replace degree certificate input with `DraftFileInput`
- [ ] Replace government ID input with `DraftFileInput`
- [ ] Replace NYSC certificate input with `DraftFileInput`

### Change 6: Step 5 Profile Photo (Line ~1065)
- [ ] Replace profile photo input with `DraftFileInput`

### Change 7: Form Submission (Line ~570)
- [ ] Add `clearAllDraftReferences()` call after successful submission

## Testing

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/onboarding/tutor`
- [ ] Test file uploads:
  - [ ] Upload degree certificate (PDF, < 5MB)
  - [ ] Upload government ID (JPG, < 5MB)
  - [ ] Upload profile photo (PNG, < 5MB)
- [ ] Verify upload progress shows
- [ ] Verify success messages appear
- [ ] Refresh the page
- [ ] Verify all files are restored
- [ ] Verify file previews display
- [ ] Complete the entire form
- [ ] Submit the form
- [ ] Verify drafts are cleared from localStorage

### Error Testing
- [ ] Try uploading oversized file (should show error)
- [ ] Try uploading wrong file type (should show error)
- [ ] Test with slow network (progress should show)
- [ ] Test file replacement (upload same type twice)

### Browser Console
- [ ] No errors in console during upload
- [ ] No errors in console during restoration
- [ ] No errors in console during submission

## Deployment (When Ready)

- [ ] Commit all changes to git
- [ ] Push to repository
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Add `ADMIN_API_KEY` to Vercel environment variables
- [ ] Verify cron job is configured: `vercel crons ls`
- [ ] Test on production URL
- [ ] Monitor logs for first 24 hours

## Post-Deployment Verification

- [ ] Create test user account
- [ ] Complete full onboarding flow
- [ ] Verify files upload correctly
- [ ] Verify drafts restore on refresh
- [ ] Verify form submission works
- [ ] Check Vercel logs for errors
- [ ] Wait for first cron job (2:00 AM UTC)
- [ ] Verify cleanup job runs successfully

## Documentation Review

- [ ] Read `INTEGRATION_GUIDE_STEP_BY_STEP.md`
- [ ] Review `docs/api/draft-storage.md`
- [ ] Review `docs/draft-storage-guide.md`
- [ ] Keep `NEXT_STEPS.md` handy for reference

## Troubleshooting

If you encounter issues:

1. **Uploads failing:**
   - Check Supabase Storage bucket exists
   - Verify RLS policies are applied
   - Check browser console for errors
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set

2. **Drafts not restoring:**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check localStorage has draft references
   - Verify Clerk authentication is working

3. **TypeScript errors:**
   - Verify all imports are correct
   - Check file paths match your structure
   - Run `npm run build` to see all errors

4. **Runtime errors:**
   - Check browser console
   - Check Vercel logs (if deployed)
   - Verify environment variables are set
   - Test API endpoints with curl

## Success Criteria

✅ You're done when:
- All checklist items are complete
- No errors in browser console
- Files upload and restore correctly
- Form submission clears drafts
- Tests pass locally
- Production deployment works

---

**Current Status:** Ready to integrate
**Estimated Time:** 1-2 hours for code changes + testing
**Next Step:** Follow `INTEGRATION_GUIDE_STEP_BY_STEP.md`
