'use client';

/**
 * Integration guide for adding draft storage to tutor onboarding
 * 
 * This file shows the key changes needed to integrate draft storage.
 * Apply these changes to app/onboarding/tutor/page.tsx
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DraftFileInput } from '@/components/onboarding/DraftFileInput';
import {
    validateDraftsWithServer,
    cleanupStaleDraftReferences,
    clearAllDraftReferences
} from '@/lib/utils/draft-restoration';
import { type DraftMetadata, type FileType } from '@/lib/db/draft-operations';

// Add to existing state in TutorOnboardingPage component:
export function useDraftIntegration() {
    const { user } = useUser();
    const [draftMetadata, setDraftMetadata] = useState<Record<FileType, DraftMetadata | null>>({
        degree_certificate: null,
        government_id: null,
        nysc_certificate: null,
        profile_photo: null,
        intro_video: null,
    });
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
    const [draftError, setDraftError] = useState<string | null>(null);

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

    return { draftMetadata, isLoadingDrafts, draftError, setDraftMetadata };
}

// Example: Replace Step 4 file inputs with DraftFileInput components
export function Step4WithDrafts({ formData, setFormData, user, draftMetadata, setDraftMetadata }: any) {
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

            // Update form state
            setFormData((prev: any) => ({
                ...prev,
                [fileType === 'degree_certificate' ? 'degreeCertificate' :
                    fileType === 'government_id' ? 'governmentId' :
                        fileType === 'nysc_certificate' ? 'nyscCertificate' :
                            fileType === 'profile_photo' ? 'profilePhoto' :
                                'introVideo']: file
            }));
        } catch (error) {
            console.error('Failed to restore draft:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">
                    Verification Documents
                </h2>
                <p className="text-gray-600 font-inter text-sm">
                    Upload your credentials for verification.
                </p>
            </div>

            {/* Degree Certificate */}
            <DraftFileInput
                fileType="degree_certificate"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024} // 5MB
                label="Degree Certificate"
                description="Upload your university degree or teaching certificate (PDF, JPG, PNG - Max 5MB)"
                value={formData.degreeCertificate}
                draftMetadata={draftMetadata.degree_certificate}
                onChange={(file) => setFormData({ ...formData, degreeCertificate: file })}
                onDraftRestore={(metadata) => handleDraftRestore(metadata, 'degree_certificate')}
                clerkUserId={user?.id || ''}
            />

            {/* Government ID */}
            <DraftFileInput
                fileType="government_id"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024} // 5MB
                label="Government ID"
                description="Upload a valid government-issued ID (NIN, Driver's License, Passport - Max 5MB)"
                value={formData.governmentId}
                draftMetadata={draftMetadata.government_id}
                onChange={(file) => setFormData({ ...formData, governmentId: file })}
                onDraftRestore={(metadata) => handleDraftRestore(metadata, 'government_id')}
                clerkUserId={user?.id || ''}
            />

            {/* NYSC Certificate (Optional) */}
            <DraftFileInput
                fileType="nysc_certificate"
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024} // 5MB
                label="NYSC Certificate (Optional)"
                description="Upload your NYSC discharge certificate if applicable (Max 5MB)"
                value={formData.nyscCertificate}
                draftMetadata={draftMetadata.nysc_certificate}
                onChange={(file) => setFormData({ ...formData, nyscCertificate: file })}
                onDraftRestore={(metadata) => handleDraftRestore(metadata, 'nysc_certificate')}
                clerkUserId={user?.id || ''}
            />
        </div>
    );
}

// Example: Replace Step 5 profile photo input
export function Step5WithDrafts({ formData, setFormData, user, draftMetadata }: any) {
    const handleDraftRestore = async (metadata: DraftMetadata) => {
        try {
            const response = await fetch(`/api/drafts/download/${metadata.id}`);
            if (!response.ok) throw new Error('Failed to get download URL');

            const { signedUrl } = await response.json();
            const fileResponse = await fetch(signedUrl);
            const blob = await fileResponse.blob();
            const file = new File([blob], metadata.original_filename, { type: metadata.mime_type });

            setFormData((prev: any) => ({ ...prev, profilePhoto: file }));
        } catch (error) {
            console.error('Failed to restore draft:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">
                    Profile Photo
                </h2>
                <p className="text-gray-600 font-inter text-sm">
                    Upload a professional photo of yourself.
                </p>
            </div>

            <DraftFileInput
                fileType="profile_photo"
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                label="Profile Photo"
                description="Upload a clear, professional photo (JPG, PNG - Max 5MB)"
                value={formData.profilePhoto}
                draftMetadata={draftMetadata.profile_photo}
                onChange={(file) => setFormData({ ...formData, profilePhoto: file })}
                onDraftRestore={handleDraftRestore}
                clerkUserId={user?.id || ''}
            />
        </div>
    );
}

// Add to handleSubmit function - clear drafts after successful submission:
export function handleSubmitWithDraftCleanup(originalHandleSubmit: Function) {
    return async (e: React.FormEvent) => {
        try {
            await originalHandleSubmit(e);

            // Clear draft references after successful submission
            clearAllDraftReferences();
        } catch (error) {
            // Handle error
            throw error;
        }
    };
}
