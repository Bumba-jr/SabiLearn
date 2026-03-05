# Step-by-Step Integration Guide for Draft Storage

This guide shows you exactly where and what to add to `app/onboarding/tutor/page.tsx` to integrate draft storage.

## Overview of Changes

You'll be making 6 changes to the file:
1. Add imports at the top
2. Add draft state variables
3. Add draft loading effect
4. Replace Step 4 file inputs (3 files)
5. Replace Step 5 profile photo input
6. Update handleSubmit to clear drafts

---

## Change 1: Add Imports (Line ~6)

**Location:** At the top of the file, after the existing imports

**Find this line:**
```typescript
import { BookOpen, ChevronDown, Check, Search, Plus, X, Trash2 } from 'lucide-react';
```

**Add these imports right after it:**
```typescript
import { DraftFileInput } from '@/components/onboarding/DraftFileInput';
import { 
    validateDraftsWithServer, 
    cleanupStaleDraftReferences, 
    clearAllDraftReferences 
} from '@/lib/utils/draft-restoration';
import { type DraftMetadata, type FileType } from '@/lib/db/draft-operations';
```

---

## Change 2: Add Draft State Variables (Line ~220)

**Location:** Inside the `TutorOnboardingPage` component, after the existing state declarations

**Find this section (around line 220):**
```typescript
const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    // ... rest of formData
});
```

**Add these state variables right after the formData useState:**
```typescript
// Draft storage state
const [draftMetadata, setDraftMetadata] = useState<Record<FileType, DraftMetadata | null>>({
    degree_certificate: null,
    government_id: null,
    nysc_certificate: null,
    profile_photo: null,
    intro_video: null,
});
const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
const [draftError, setDraftError] = useState<string | null>(null);
```

---

## Change 3: Add Draft Loading Effect (Line ~300)

**Location:** After the existing useEffect hooks (around line 300, after the account name auto-set effect)

**Find this section:**
```typescript
// Auto-set account name from user's name when account number is complete
useEffect(() => {
    if (formData.accountNumber.length === 10 && formData.bankName && formData.firstName && formData.lastName) {
        const fullName = `${formData.firstName} ${formData.lastName}`.toUpperCase();
        setFormData(prev => ({ ...prev, accountName: fullName }));
    }
}, [formData.accountNumber, formData.bankName, formData.firstName, formData.lastName]);
```

**Add this new useEffect right after it:**
```typescript
// Load and validate drafts on mount
useEffect(() => {
    async function loadDrafts() {
        if (!user?.id) return;

        try {
            setIsLoadingDrafts(true);
            setDraftError(null);

            // Validate drafts with server
            const validatedDrafts = await validateDraftsWithServer(user.id);

            // Update state with validated drafts
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

            // Cleanup stale references
            await cleanupStaleDraftReferences(user.id);
        } catch (error) {
            console.error('Failed to load drafts:', error);
            setDraftError('Failed to load saved files. You can continue without them.');
        } finally {
            setIsLoadingDrafts(false);
        }
    }

    loadDrafts();
}, [user?.id]);
```

---

## Change 4: Helper Function for Draft Restoration (Line ~350)

**Location:** Inside the component, before the render return statement

**Add this helper function:**
```typescript
// Helper function to restore a draft file
const handleDraftRestore = async (metadata: DraftMetadata, fileType: FileType) => {
    try {
        // Fetch signed URL for the draft
        const response = await fetch(`/api/drafts/download/${metadata.id}`);
        if (!response.ok) throw new Error('Failed to get download URL');

        const { signedUrl } = await response.json();

        // Fetch the file
        const fileResponse = await fetch(signedUrl);
        const blob = await fileResponse.blob();
        const file = new File([blob], metadata.original_filename, { type: metadata.mime_type });

        // Update form state based on file type
        const fieldMap: Record<FileType, string> = {
            degree_certificate: 'degreeCertificate',
            government_id: 'governmentId',
            nysc_certificate: 'nyscCertificate',
            profile_photo: 'profilePhoto',
            intro_video: 'introVideo',
        };

        const fieldName = fieldMap[fileType];
        setFormData(prev => ({ ...prev, [fieldName]: file }));
    } catch (error) {
        console.error('Failed to restore draft:', error);
        alert('Failed to restore file. Please upload again.');
    }
};
```

---

## Change 5: Replace Step 4 File Inputs (Line ~950-1050)

**Location:** In the Step 4 section (Verification Documents)

### 5a. Replace Degree Certificate Input

**Find this code (around line 950):**
```typescript
<div>
    <label className="block text-gray-700 font-inter font-medium mb-2">Degree Certificate</label>
    <p className="text-sm text-gray-500 mb-3 font-inter">Upload your university degree or teaching certificate</p>
    <div className="flex items-center gap-3">
        <label className="cursor-pointer">
            <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                        setFormData({ ...formData, degreeCertificate: file });
                    }
                }}
                className="hidden"
            />
            <span className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-inter font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all inline-block">
                {formData.degreeCertificate ? 'Change' : 'Browse'}
            </span>
        </label>
    </div>
    {formData.degreeCertificate && (
        <div className="mt-3 text-sm text-green-600 font-inter flex items-center gap-2">
            <Check className="w-4 h-4" />
            {formData.degreeCertificate.name}
        </div>
    )}
</div>
```

**Replace with:**
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
    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'degree_certificate')}
    clerkUserId={user?.id || ''}
/>
```

### 5b. Replace Government ID Input

**Find this code (around line 990):**
```typescript
<div>
    <label className="block text-gray-700 font-inter font-medium mb-2">Government ID</label>
    <p className="text-sm text-gray-500 mb-3 font-inter">Upload a valid government-issued ID</p>
    <div className="flex items-center gap-3">
        <label className="cursor-pointer">
            <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                        setFormData({ ...formData, governmentId: file });
                    }
                }}
                className="hidden"
            />
            <span className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-inter font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all inline-block">
                {formData.governmentId ? 'Change' : 'Browse'}
            </span>
        </label>
    </div>
    {formData.governmentId && (
        <div className="mt-3 text-sm text-green-600 font-inter flex items-center gap-2">
            <Check className="w-4 h-4" />
            {formData.governmentId.name}
        </div>
    )}
</div>
```

**Replace with:**
```typescript
<DraftFileInput
    fileType="government_id"
    accept=".pdf,.jpg,.jpeg,.png"
    maxSize={5 * 1024 * 1024}
    label="Government ID"
    description="Upload a valid government-issued ID (NIN, Driver's License, Passport - Max 5MB)"
    value={formData.governmentId}
    draftMetadata={draftMetadata.government_id}
    onChange={(file) => setFormData({ ...formData, governmentId: file })}
    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'government_id')}
    clerkUserId={user?.id || ''}
/>
```

### 5c. Replace NYSC Certificate Input

**Find this code (around line 1030):**
```typescript
<div>
    <label className="block text-gray-700 font-inter font-medium mb-2">NYSC Certificate (Optional)</label>
    <p className="text-sm text-gray-500 mb-3 font-inter">Upload your NYSC discharge certificate if applicable</p>
    <div className="flex items-center gap-3">
        <label className="cursor-pointer">
            <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                        setFormData({ ...formData, nyscCertificate: file });
                    }
                }}
                className="hidden"
            />
            <span className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-inter font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all inline-block">
                {formData.nyscCertificate ? 'Change' : 'Browse'}
            </span>
        </label>
    </div>
    {formData.nyscCertificate && (
        <div className="mt-3 text-sm text-green-600 font-inter flex items-center gap-2">
            <Check className="w-4 h-4" />
            {formData.nyscCertificate.name}
        </div>
    )}
</div>
```

**Replace with:**
```typescript
<DraftFileInput
    fileType="nysc_certificate"
    accept=".pdf,.jpg,.jpeg,.png"
    maxSize={5 * 1024 * 1024}
    label="NYSC Certificate (Optional)"
    description="Upload your NYSC discharge certificate if applicable (Max 5MB)"
    value={formData.nyscCertificate}
    draftMetadata={draftMetadata.nysc_certificate}
    onChange={(file) => setFormData({ ...formData, nyscCertificate: file })}
    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'nysc_certificate')}
    clerkUserId={user?.id || ''}
/>
```

---

## Change 6: Replace Step 5 Profile Photo Input (Line ~1065)

**Location:** In the Step 5 section (Profile Photo)

**Find this code (around line 1065-1130):**
```typescript
<div className="flex items-center gap-6">
    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
        {formData.profilePhoto ? (
            <img src={URL.createObjectURL(formData.profilePhoto)} alt="Profile" className="w-full h-full object-cover" />
        ) : (
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        )}
    </div>
    <div className="flex-1">
        <label className="cursor-pointer">
            <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                        // Handle HEIC conversion if needed
                        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                            try {
                                const heic2any = (await import('heic2any')).default;
                                const convertedBlob = await heic2any({
                                    blob: file,
                                    toType: 'image/jpeg',
                                    quality: 0.9,
                                });
                                const convertedFile = new File(
                                    [convertedBlob as Blob],
                                    file.name.replace(/\.heic$/i, '.jpg'),
                                    { type: 'image/jpeg' }
                                );
                                setFormData({ ...formData, profilePhoto: convertedFile });
                            } catch (error) {
                                console.error('Error converting HEIC:', error);
                                alert('Failed to convert HEIC image. Please try a different format.');
                            }
                        } else {
                            setFormData({ ...formData, profilePhoto: file });
                        }
                    }
                }}
                className="hidden"
            />
            <span className="px-6 py-2.5 rounded-lg bg-[#FF6B35] text-white font-inter font-medium hover:bg-[#FF6B35]/90 transition-all inline-block cursor-pointer">
                {formData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
            </span>
        </label>
        <p className="text-sm text-gray-500 mt-2 font-inter">JPG, PNG or HEIC (max 5MB)</p>
    </div>
</div>
```

**Replace with:**
```typescript
<DraftFileInput
    fileType="profile_photo"
    accept="image/*"
    maxSize={5 * 1024 * 1024}
    label="Profile Photo"
    description="Upload a clear, professional photo (JPG, PNG, HEIC - Max 5MB)"
    value={formData.profilePhoto}
    draftMetadata={draftMetadata.profile_photo}
    onChange={(file) => setFormData({ ...formData, profilePhoto: file })}
    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'profile_photo')}
    clerkUserId={user?.id || ''}
/>
```

---

## Change 7: Update handleSubmit (Line ~500)

**Location:** In the `handleSubmit` function

**Find this code (around line 570):**
```typescript
// Clear saved data after successful submission
localStorage.removeItem('tutorOnboardingData');
localStorage.removeItem('tutorOnboardingStep');
localStorage.removeItem('tutorOnboardingAgreedToTerms');

// Show success screen
setIsSubmitted(true);
setIsSubmitting(false);
```

**Add this line after the localStorage.removeItem calls:**
```typescript
// Clear saved data after successful submission
localStorage.removeItem('tutorOnboardingData');
localStorage.removeItem('tutorOnboardingStep');
localStorage.removeItem('tutorOnboardingAgreedToTerms');

// Clear draft references
clearAllDraftReferences();

// Show success screen
setIsSubmitted(true);
setIsSubmitting(false);
```

---

## Summary of Changes

✅ **7 changes total:**
1. Added 4 import statements
2. Added 3 state variables for draft management
3. Added 1 useEffect for loading drafts
4. Added 1 helper function for draft restoration
5. Replaced 3 file inputs in Step 4
6. Replaced 1 file input in Step 5
7. Added 1 line to clear drafts on submission

---

## Testing After Integration

Once you've made all the changes:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Test the flow:**
   - Navigate to `/onboarding/tutor`
   - Upload a degree certificate
   - Upload a government ID
   - Upload a profile photo
   - Refresh the page
   - Verify files are restored
   - Complete and submit the form

3. **Check for errors:**
   - Open browser console (F12)
   - Look for any error messages
   - Verify uploads complete successfully

---

## Need Help?

If you encounter issues:
- Check the browser console for errors
- Verify all imports are correct
- Make sure the file paths match your project structure
- Review the complete example in `app/onboarding/tutor/TutorOnboardingWithDrafts.tsx`

---

**Ready to integrate?** Follow each change step-by-step, and test after completing all changes.
