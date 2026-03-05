import { useState, useCallback } from 'react';
import { type FileType } from '@/lib/db/draft-operations';

interface UseDraftFileUploadOptions {
    fileType: FileType;
    onSuccess?: (draftId: string, filename: string) => void;
    onError?: (error: string) => void;
}

interface DraftReference {
    draftId: string;
    filename: string;
    uploadedAt: string;
    fileType: FileType;
}

/**
 * Hook for uploading draft files with progress tracking
 */
export function useDraftFileUpload(options: UseDraftFileUploadOptions) {
    const { fileType, onSuccess, onError } = options;

    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(
        async (file: File, clerkUserId: string) => {
            // Validate clerkUserId before attempting upload
            if (!clerkUserId) {
                const errorMessage = 'User not authenticated. Please sign in and try again.';
                setError(errorMessage);
                onError?.(errorMessage);
                return;
            }

            setIsUploading(true);
            setProgress(0);
            setError(null);

            try {
                // Create form data
                const formData = new FormData();
                formData.append('file', file);
                formData.append('fileType', fileType);
                formData.append('clerkUserId', clerkUserId);

                console.log('🚀 Starting upload:', {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType,
                    clerkUserId
                });

                // Simulate progress (since fetch doesn't support upload progress natively)
                const progressInterval = setInterval(() => {
                    setProgress((prev) => Math.min(prev + 10, 90));
                }, 200);

                // Upload file
                const response = await fetch('/api/drafts/upload', {
                    method: 'POST',
                    body: formData,
                });

                clearInterval(progressInterval);
                setProgress(100);

                // Clone the response so we can read it multiple times if needed
                const responseClone = response.clone();

                if (!response.ok) {
                    let errorData;
                    let errorText = '';

                    try {
                        errorText = await responseClone.text();
                        console.error('❌ Upload failed - Raw response:', errorText);
                        console.error('❌ Response status:', response.status, response.statusText);

                        // Try to parse as JSON
                        if (errorText) {
                            errorData = JSON.parse(errorText);
                            console.error('❌ Parsed error data:', errorData);
                        }
                    } catch (e) {
                        console.error('❌ Could not parse error response:', e);
                        throw new Error(`Upload failed (${response.status}): ${errorText || response.statusText}`);
                    }

                    // Extract error message with better fallbacks
                    let errorMessage = 'Upload failed';

                    if (errorData?.error) {
                        errorMessage = errorData.error;
                        // Add debug info if available
                        if (errorData.debug) {
                            console.error('❌ Debug info:', errorData.debug);
                            // For user ID mismatch, provide helpful message
                            if (errorMessage.includes('User ID mismatch')) {
                                errorMessage = 'Authentication error. Please refresh the page and try again.';
                            }
                        }
                    } else if (errorData?.details) {
                        errorMessage = errorData.details;
                    } else if (errorText) {
                        errorMessage = errorText;
                    } else {
                        errorMessage = `Upload failed with status ${response.status}`;
                    }

                    throw new Error(errorMessage);
                }

                const data = await response.json();
                const draftId = data.draft.id;
                const filename = data.draft.original_filename;

                // Store draft reference in localStorage
                const draftRef: DraftReference = {
                    draftId,
                    filename,
                    uploadedAt: new Date().toISOString(),
                    fileType,
                };

                const existingDrafts = JSON.parse(
                    localStorage.getItem('draft_references') || '{}'
                );
                existingDrafts[fileType] = draftRef;
                localStorage.setItem('draft_references', JSON.stringify(existingDrafts));

                // Call success callback
                onSuccess?.(draftId, filename);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                setError(errorMessage);
                onError?.(errorMessage);
            } finally {
                setIsUploading(false);
            }
        },
        [fileType, onSuccess, onError]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        upload,
        isUploading,
        progress,
        error,
        clearError,
    };
}
