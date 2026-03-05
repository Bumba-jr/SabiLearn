# Next Steps to Complete Draft Storage Integration

## What's Been Completed ✅

All core functionality for the draft storage system has been implemented:

1. ✅ Database schema and migrations
2. ✅ Storage operations (upload, download, delete)
3. ✅ File validation utilities
4. ✅ API endpoints (upload, retrieve, delete, download, cleanup)
5. ✅ Frontend components (DraftFileInput, useDraftFileUpload hook)
6. ✅ Draft restoration utilities
7. ✅ Error logging system
8. ✅ Cron job configuration
9. ✅ Comprehensive documentation
10. ✅ Unit tests for all components

## What Remains to Be Done 📋

### 1. Database Setup (15 minutes)

Run the migration to create the `tutor_onboarding_drafts` table:

```bash
# Option A: Using Supabase CLI
supabase migration up

# Option B: Manual via Supabase Dashboard
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Copy contents of supabase/migrations/003_tutor_onboarding_drafts_storage.sql
# 3. Execute the SQL
```

### 2. Storage Bucket Setup (10 minutes)

Create and configure the Supabase Storage bucket:

1. Go to Supabase Dashboard > Storage
2. Click "Create bucket"
3. Name: `drafts`
4. Public: `No` (keep private)
5. File size limit: `100MB`
6. Follow the policy setup in `supabase/DRAFT_STORAGE_SETUP.md`

### 3. Environment Variables (5 minutes)

Generate and add the admin API key:

```bash
# Generate a secure key
openssl rand -base64 32

# Add to .env.local (replace the placeholder)
ADMIN_API_KEY=<paste_generated_key_here>

# Also add to Vercel environment variables:
# Vercel Dashboard > Project > Settings > Environment Variables
```

### 4. Code Integration (1-2 hours)

Integrate the draft storage into the tutor onboarding form. Use `app/onboarding/tutor/TutorOnboardingWithDrafts.tsx` as a reference.

**Key changes needed in `app/onboarding/tutor/page.tsx`:**

#### A. Add imports at the top:
```typescript
import { DraftFileInput } from '@/components/onboarding/DraftFileInput';
import { 
    validateDraftsWithServer, 
    cleanupStaleDraftReferences, 
    clearAllDraftReferences 
} from '@/lib/utils/draft-restoration';
import { type DraftMetadata, type FileType } from '@/lib/db/draft-operations';
```

#### B. Add draft state (around line 220):
```typescript
const [draftMetadata, setDraftMetadata] = useState<Record<FileType, DraftMetadata | null>>({
    degree_certificate: null,
    government_id: null,
    nysc_certificate: null,
    profile_photo: null,
    intro_video: null,
});
const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
```

#### C. Add draft loading effect (after existing useEffects):
```typescript
useEffect(() => {
    async function loadDrafts() {
        if (!user?.id) return;
        
        try {
            setIsLoadingDrafts(true);
            const validatedDrafts = await validateDraftsWithServer(user.id);
            
            const draftsMap: Record<FileType, DraftMetadata | null> = {
                degree_certificate: null,
                government_id: null,
                nysc_certificate: null,
                profile_photo: null,
                intro_video: null,
            };
            
            Object.entries(validatedDrafts).forEach(([fileType, metadata]) => {
                draftsMap[fileType as FileType] = metadata as DraftMetadata;
            });
            
            setDraftMetadata(draftsMap);
            await cleanupStaleDraftReferences(user.id);
        } catch (error) {
            console.error('Failed to load drafts:', error);
        } finally {
            setIsLoadingDrafts(false);
        }
    }
    
    loadDrafts();
}, [user?.id]);
```

#### D. Replace Step 4 file inputs (around line 950-1050):

Replace the degree certificate input:
```typescript
<DraftFileInput
    fileType="degree_certificate"
    accept=".pdf,.jpg,.jpeg,.png"
    maxSize={5 * 1024 * 1024}
    label="Degree Certificate"
    description="Upload your university degree or teaching certificate (PDF, JPG, PNG - Max 5MB)"
    value={formData.degreeCertificate}
    draftMetadata={draftMetadata.degree_certificate}
    onChange={(file) => setFormData({ ...formData, degreeCertificate: file })}
    onDraftRestore={async (metadata) => {
        const response = await fetch(`/api/drafts/download/${metadata.id}`);
        const { signedUrl } = await response.json();
        const fileResponse = await fetch(signedUrl);
        const blob = await fileResponse.blob();
        const file = new File([blob], metadata.original_filename, { type: metadata.mime_type });
        setFormData({ ...formData, degreeCertificate: file });
    }}
    clerkUserId={user?.id || ''}
/>
```

Repeat for government ID and NYSC certificate.

#### E. Replace Step 5 profile photo input (around line 1065):

```typescript
<DraftFileInput
    fileType="profile_photo"
    accept="image/*"
    maxSize={5 * 1024 * 1024}
    label="Profile Photo"
    description="Upload a clear, professional photo (JPG, PNG - Max 5MB)"
    value={formData.profilePhoto}
    draftMetadata={draftMetadata.profile_photo}
    onChange={(file) => setFormData({ ...formData, profilePhoto: file })}
    onDraftRestore={async (metadata) => {
        const response = await fetch(`/api/drafts/download/${metadata.id}`);
        const { signedUrl } = await response.json();
        const fileResponse = await fetch(signedUrl);
        const blob = await fileResponse.blob();
        const file = new File([blob], metadata.original_filename, { type: metadata.mime_type });
        setFormData({ ...formData, profilePhoto: file });
    }}
    clerkUserId={user?.id || ''}
/>
```

#### F. Update handleSubmit (around line 500):

Add draft cleanup after successful submission:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... existing validation code ...
    
    try {
        const response = await fetch('/api/onboarding/tutor', {
            method: 'POST',
            // ... existing code ...
        });
        
        if (!response.ok) {
            throw new Error('Failed to complete onboarding');
        }
        
        // Clear saved data
        localStorage.removeItem('tutorOnboardingData');
        localStorage.removeItem('tutorOnboardingStep');
        localStorage.removeItem('tutorOnboardingAgreedToTerms');
        
        // NEW: Clear draft references
        clearAllDraftReferences();
        
        setIsSubmitted(true);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
        setIsSubmitting(false);
    }
};
```

### 5. Testing (30 minutes)

Test the complete flow locally:

```bash
# Start development server
npm run dev

# Test checklist:
# 1. Navigate to /onboarding/tutor
# 2. Upload a degree certificate
# 3. Upload a government ID
# 4. Upload a profile photo
# 5. Refresh the page
# 6. Verify all files are restored
# 7. Complete and submit the form
# 8. Verify drafts are cleared
```

### 6. Deployment (30 minutes)

Deploy to Vercel:

```bash
# Deploy to production
vercel --prod

# Verify cron job is configured
vercel crons ls

# Check deployment logs
vercel logs
```

### 7. Post-Deployment Verification (15 minutes)

1. Test on production URL
2. Upload files as a test user
3. Refresh and verify restoration
4. Complete form submission
5. Monitor logs for errors
6. Wait for first cron job execution (2:00 AM UTC)

## Quick Start Commands

```bash
# 1. Run migration
supabase migration up

# 2. Generate admin API key
openssl rand -base64 32

# 3. Test locally
npm run dev

# 4. Run tests
npm test

# 5. Deploy
vercel --prod
```

## Documentation References

- **API Documentation:** `docs/api/draft-storage.md`
- **Developer Guide:** `docs/draft-storage-guide.md`
- **Setup Instructions:** `supabase/DRAFT_STORAGE_SETUP.md`
- **Integration Guide:** `app/onboarding/tutor/TutorOnboardingWithDrafts.tsx`
- **Implementation Summary:** `DRAFT_STORAGE_IMPLEMENTATION.md`
- **Setup Checklist:** `DRAFT_STORAGE_SETUP_CHECKLIST.md`

## Estimated Time to Complete

- Database setup: 15 minutes
- Storage setup: 10 minutes
- Environment variables: 5 minutes
- Code integration: 1-2 hours
- Testing: 30 minutes
- Deployment: 30 minutes
- Verification: 15 minutes

**Total: 3-4 hours**

## Need Help?

If you encounter issues:

1. Check the comprehensive documentation in `docs/`
2. Review the integration guide in `app/onboarding/tutor/TutorOnboardingWithDrafts.tsx`
3. Test API endpoints manually with curl (examples in `docs/api/draft-storage.md`)
4. Check Vercel and Supabase logs for errors
5. Verify all environment variables are set correctly

## Success Indicators

You'll know the integration is successful when:

- ✅ Files upload without errors
- ✅ Progress indicators show during upload
- ✅ Success messages appear after upload
- ✅ Page refresh restores all uploaded files
- ✅ File previews display correctly
- ✅ Form submission clears drafts
- ✅ Cron job runs daily without errors
- ✅ No errors in production logs

---

**Ready to proceed?** Start with the database setup and work through each step sequentially. The entire system is built and tested - you just need to wire it up!
