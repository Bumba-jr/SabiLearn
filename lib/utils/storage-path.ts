/**
 * Storage path utility for tutor onboarding draft storage
 * Generates consistent storage paths for draft files in Supabase Storage
 * Path format: drafts/{clerk_id}/{file_type}/{timestamp}_{sanitized_filename}
 */

import type { FileType } from './file-validation';

export interface StoragePathComponents {
    clerkId: string;
    fileType: FileType;
    timestamp: number;
    filename: string;
}

export interface ParsedStoragePath {
    clerkId: string;
    fileType: FileType;
    filename: string;
}

/**
 * Sanitizes a filename by removing special characters and preserving the extension
 * Requirements: 2.1, 2.3
 * 
 * @param filename - Original filename to sanitize
 * @returns Sanitized filename with preserved extension
 * 
 * @example
 * sanitizeFilename('My Degree (2023).pdf') // 'My_Degree_2023.pdf'
 * sanitizeFilename('photo@#$%.jpg') // 'photo.jpg'
 */
export function sanitizeFilename(filename: string): string {
    // Extract extension
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename;

    // Remove special characters, keep alphanumeric, spaces, hyphens, and underscores
    // Replace spaces with underscores
    const sanitized = nameWithoutExt
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    // If sanitization resulted in empty string, use a default name
    const finalName = sanitized || 'file';

    return `${finalName}${extension.toLowerCase()}`;
}

/**
 * Generates a storage path for a draft file
 * Requirements: 2.1, 2.3
 * 
 * Path format: {clerk_id}/{file_type}/{timestamp}_{sanitized_filename}
 * Note: The bucket name 'drafts' is NOT included in the path
 * 
 * @param clerkId - Clerk user ID
 * @param fileType - Type of file being uploaded
 * @param filename - Original filename
 * @param timestamp - Optional timestamp (defaults to current time)
 * @returns Storage path (without bucket name)
 * 
 * @example
 * generateStoragePath('user_123', 'degree_certificate', 'my degree.pdf')
 * // 'user_123/degree_certificate/1704067200000_my_degree.pdf'
 */
export function generateStoragePath(
    clerkId: string,
    fileType: FileType,
    filename: string,
    timestamp?: number
): string {
    const ts = timestamp ?? Date.now();
    const sanitized = sanitizeFilename(filename);

    return `${clerkId}/${fileType}/${ts}_${sanitized}`;
}

/**
 * Parses a storage path to extract clerk_id and file_type
 * Requirements: 2.1, 2.3
 * 
 * @param storagePath - Storage path to parse
 * @returns Parsed components or null if invalid format
 * 
 * @example
 * parseStoragePath('user_123/degree_certificate/1704067200000_degree.pdf')
 * // { clerkId: 'user_123', fileType: 'degree_certificate', filename: '1704067200000_degree.pdf' }
 */
export function parseStoragePath(storagePath: string): ParsedStoragePath | null {
    // Expected format: {clerk_id}/{file_type}/{timestamp}_{filename}
    const parts = storagePath.split('/');

    if (parts.length !== 3) {
        return null;
    }

    const [clerkId, fileType, filename] = parts;

    // Validate file type
    const validFileTypes: FileType[] = [
        'degree_certificate',
        'government_id',
        'nysc_certificate',
        'profile_photo',
        'intro_video'
    ];

    if (!validFileTypes.includes(fileType as FileType)) {
        return null;
    }

    return {
        clerkId,
        fileType: fileType as FileType,
        filename
    };
}
