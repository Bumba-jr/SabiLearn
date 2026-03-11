'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useDraftFileUpload } from '@/hooks/useDraftFileUpload';
import { type DraftMetadata } from '@/lib/db/draft-operations';

interface ProfilePhotoInputProps {
    value?: File | null;
    draftMetadata?: DraftMetadata | null;
    onChange: (file: File | null) => void;
    onDraftRestore?: (metadata: DraftMetadata) => void;
    authUserId: string;
}

export function ProfilePhotoInput({
    value,
    draftMetadata,
    onChange,
    onDraftRestore,
    authUserId,
}: ProfilePhotoInputProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload, isUploading, progress, error, clearError } = useDraftFileUpload({
        fileType: 'profile_photo',
        onSuccess: (draftId, filename) => {
            toast.success('Photo uploaded successfully', {
                description: `${filename} has been saved`,
            });
        },
        onError: (errorMessage) => {
            toast.error('Upload failed', {
                description: errorMessage,
                duration: 5000,
            });
        },
    });

    // Create preview URL when value changes (with HEIC conversion)
    useEffect(() => {
        async function createPreview() {
            if (value) {
                // Check if file is HEIC/HEIF format
                const isHEIC = value.type === 'image/heic' ||
                    value.type === 'image/heif' ||
                    value.name.toLowerCase().endsWith('.heic') ||
                    value.name.toLowerCase().endsWith('.heif');

                if (isHEIC) {
                    try {
                        // Dynamically import heic2any only on client side
                        const heic2any = (await import('heic2any')).default;

                        // Convert HEIC to JPEG for preview
                        const convertedBlob = await heic2any({
                            blob: value,
                            toType: 'image/jpeg',
                            quality: 0.9
                        });

                        // heic2any can return Blob or Blob[], handle both cases
                        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                    } catch (error) {
                        console.error('HEIC conversion error:', error);
                        toast.error('Preview failed', {
                            description: 'Could not preview HEIC image, but it will still upload',
                            duration: 3000,
                        });
                        // Set a placeholder or skip preview
                        setPreviewUrl(null);
                    }
                } else {
                    // For other image formats, create preview normally
                    const url = URL.createObjectURL(value);
                    setPreviewUrl(url);
                }

                return () => {
                    if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                    }
                };
            } else {
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                }
            }
        }

        createPreview();
    }, [value]);

    // Handle file selection
    const handleFileSelect = useCallback(
        async (file: File) => {
            const maxSize = 5 * 1024 * 1024; // 5MB

            // Client-side validation
            if (file.size > maxSize) {
                toast.error('File too large', {
                    description: 'Photo must be less than 5MB',
                    duration: 5000,
                });
                return;
            }

            // Validate file type (accept images and GIFs)
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
            const isValidType = validTypes.includes(file.type) ||
                file.name.toLowerCase().endsWith('.heic') ||
                file.name.toLowerCase().endsWith('.heif') ||
                file.name.toLowerCase().endsWith('.gif');

            if (!isValidType) {
                toast.error('Invalid file type', {
                    description: 'Please select an image file (JPG, PNG, GIF, HEIC, or WebP)',
                    duration: 5000,
                });
                return;
            }

            clearError();
            onChange(file);
            await upload(file, authUserId);
        },
        [onChange, upload, authUserId, clearError]
    );

    // Handle input change
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    // Handle draft restoration
    const handleRestoreDraft = useCallback(() => {
        if (draftMetadata && onDraftRestore) {
            onDraftRestore(draftMetadata);
        }
    }, [draftMetadata, onDraftRestore]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>

            {/* Draft restoration UI */}
            {draftMetadata && !value && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-900">
                                Draft found: {draftMetadata.original_filename}
                            </p>
                            <p className="text-xs text-orange-700">
                                Uploaded {new Date(draftMetadata.uploaded_at).toLocaleDateString()}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRestoreDraft}
                            className="px-3 py-1 text-sm bg-[#FF6B35] text-white rounded hover:bg-[#FF8C5A] transition-colors"
                        >
                            Restore
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-start gap-6">
                {/* Circular Photo Preview */}
                <div className="relative flex-shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg
                                className="w-16 h-16 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        )}
                    </div>

                    {/* Upload Progress Overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-xs text-white font-medium">{progress}%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload Button and Description */}
                <div className="flex-1 space-y-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif,.gif"
                        onChange={handleInputChange}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-6 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {value ? 'Change Photo' : 'Upload Photo'}
                    </button>

                    <p className="text-sm text-gray-500">
                        Professional headshot. Smile, good lighting, plain background. Accepts JPG, PNG, GIF, HEIC.
                    </p>

                    {/* File Info */}
                    {value && !isUploading && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>{value.name}</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
