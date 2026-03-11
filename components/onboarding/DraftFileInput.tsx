'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useDraftFileUpload } from '@/hooks/useDraftFileUpload';
import { type FileType, type DraftMetadata } from '@/lib/db/draft-operations';

interface DraftFileInputProps {
    fileType: FileType;
    accept: string;
    maxSize: number;
    label: string;
    description?: string;
    value?: File | null;
    draftMetadata?: DraftMetadata | null;
    onChange: (file: File | null) => void;
    onDraftRestore?: (metadata: DraftMetadata) => void;
    authUserId: string;
}

export function DraftFileInput({
    fileType,
    accept,
    maxSize,
    label,
    description,
    value,
    draftMetadata,
    onChange,
    onDraftRestore,
    authUserId,
}: DraftFileInputProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload, isUploading, progress, error, clearError } = useDraftFileUpload({
        fileType,
        onSuccess: (draftId, filename) => {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            toast.success('File uploaded successfully', {
                description: `${filename} has been saved as a draft`,
            });
        },
        onError: (errorMessage) => {
            // Don't clear the file on error - keep it in the form
            toast.error('Upload failed', {
                description: errorMessage,
                duration: 5000, // Show error longer
            });
        },
    });

    // Handle file selection
    const handleFileSelect = useCallback(
        async (file: File) => {
            // Client-side validation
            if (file.size > maxSize) {
                const errorMsg = `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`;
                toast.error('File too large', {
                    description: errorMsg,
                    duration: 5000,
                });
                return;
            }

            // Clear any previous errors
            clearError();

            // Update parent component (this will trigger the useEffect to create preview)
            onChange(file);

            // Upload to server
            await upload(file, authUserId);
        },
        [maxSize, onChange, upload, authUserId, clearError]
    );

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
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

            // Note: The parent component will set the file via onChange
            // We don't create a preview here because the file will be fetched asynchronously
            // The preview will be created when the file is set via the value prop
        }
    }, [draftMetadata, onDraftRestore]);

    // Create preview URL when value changes (including restored files)
    useEffect(() => {
        if (value) {
            // Create preview for images/videos
            if (value.type.startsWith('image/') || value.type.startsWith('video/')) {
                const url = URL.createObjectURL(value);
                setPreviewUrl(url);

                // Cleanup old preview URL
                return () => URL.revokeObjectURL(url);
            }
        } else {
            // Clear preview when file is removed
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        }
    }, [value]);

    // Handle retry
    const handleRetry = useCallback(() => {
        clearError();
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [clearError]);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            {description && (
                <p className="text-sm text-gray-500">{description}</p>
            )}

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

            {/* File input area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-colors
                    ${isDragging ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    ${value ? 'border-green-500 bg-green-50/50' : ''}
                `}
                onClick={() => !value && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Uploading...</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-[#FF6B35] h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500">{progress}%</p>
                    </div>
                ) : value ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-green-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-semibold">File selected</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm text-gray-900 font-medium break-all">{value.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                                {(value.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                                if (previewUrl) {
                                    URL.revokeObjectURL(previewUrl);
                                    setPreviewUrl(null);
                                }
                            }}
                            className="mt-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                            Remove file
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-600">
                            Drag and drop or click to select
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
                        </p>
                    </div>
                )}
            </div>

            {/* Success message */}
            {showSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-800">File uploaded successfully!</p>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-red-800">{error}</p>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="ml-2 text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
