/**
 * File validation utility for tutor onboarding draft storage
 * Validates file types, sizes, MIME types, and rejects executable files
 */

export type FileType =
    | 'degree_certificate'
    | 'government_id'
    | 'nysc_certificate'
    | 'profile_photo'
    | 'intro_video';

export interface FileValidationRules {
    maxSize: number; // bytes
    acceptedMimeTypes: string[];
    acceptedExtensions: string[];
}

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * File validation rules for each file type
 * Requirements: 1.4, 12.1, 12.2, 12.3
 */
export const FILE_VALIDATION_RULES: Record<FileType, FileValidationRules> = {
    degree_certificate: {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ],
        acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    government_id: {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ],
        acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    nysc_certificate: {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ],
        acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    profile_photo: {
        maxSize: 5 * 1024 * 1024, // 5 MB
        acceptedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/heic',
            'image/webp'
        ],
        acceptedExtensions: ['.jpg', '.jpeg', '.png', '.heic', '.webp']
    },
    intro_video: {
        maxSize: 100 * 1024 * 1024, // 100 MB
        acceptedMimeTypes: [
            'video/mp4',
            'video/webm',
            'video/quicktime'
        ],
        acceptedExtensions: ['.mp4', '.webm', '.mov']
    }
};

/**
 * Executable file extensions that should be rejected
 * Requirement: 12.6
 */
const EXECUTABLE_EXTENSIONS = [
    '.exe',
    '.sh',
    '.bat',
    '.js',
    '.py',
    '.cmd',
    '.com',
    '.app',
    '.jar',
    '.msi',
    '.vbs',
    '.ps1'
];

/**
 * Validates that the file type is one of the 5 supported types
 * Requirement: 2.2
 */
export function validateFileType(fileType: string): FileValidationResult {
    const validTypes: FileType[] = [
        'degree_certificate',
        'government_id',
        'nysc_certificate',
        'profile_photo',
        'intro_video'
    ];

    if (!validTypes.includes(fileType as FileType)) {
        return {
            valid: false,
            error: `Invalid file type. Must be one of: ${validTypes.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Validates file size against the limits for the given file type
 * Requirements: 1.4, 12.1, 12.2, 12.3
 */
export function validateFileSize(
    file: File,
    fileType: FileType
): FileValidationResult {
    const rules = FILE_VALIDATION_RULES[fileType];

    if (file.size > rules.maxSize) {
        const maxSizeMB = rules.maxSize / (1024 * 1024);
        return {
            valid: false,
            error: `File size exceeds the maximum limit of ${maxSizeMB}MB for ${fileType}`
        };
    }

    if (file.size === 0) {
        return {
            valid: false,
            error: 'File is empty'
        };
    }

    return { valid: true };
}

/**
 * Validates that the file's MIME type matches its extension
 * Requirements: 12.4, 12.5
 */
export function validateMimeType(
    file: File,
    fileType: FileType
): FileValidationResult {
    const rules = FILE_VALIDATION_RULES[fileType];
    const fileName = file.name.toLowerCase();

    // Check if MIME type is accepted
    if (!rules.acceptedMimeTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Accepted types for ${fileType}: ${rules.acceptedMimeTypes.join(', ')}`
        };
    }

    // Check if file extension is accepted
    const hasValidExtension = rules.acceptedExtensions.some(ext =>
        fileName.endsWith(ext.toLowerCase())
    );

    if (!hasValidExtension) {
        return {
            valid: false,
            error: `Invalid file extension. Accepted extensions for ${fileType}: ${rules.acceptedExtensions.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Rejects files with executable extensions
 * Requirement: 12.6
 */
export function rejectExecutableFiles(file: File): FileValidationResult {
    const fileName = file.name.toLowerCase();

    const hasExecutableExtension = EXECUTABLE_EXTENSIONS.some(ext =>
        fileName.endsWith(ext.toLowerCase())
    );

    if (hasExecutableExtension) {
        return {
            valid: false,
            error: 'Executable files are not allowed for security reasons'
        };
    }

    return { valid: true };
}

/**
 * Validates a file against all validation rules
 * Combines all validation checks and returns descriptive errors
 * Requirements: 1.4, 2.2, 12.1-12.6
 */
export function validateFile(
    file: File,
    fileType: string
): FileValidationResult {
    // Validate file type
    const fileTypeResult = validateFileType(fileType);
    if (!fileTypeResult.valid) {
        return fileTypeResult;
    }

    // Reject executable files
    const executableResult = rejectExecutableFiles(file);
    if (!executableResult.valid) {
        return executableResult;
    }

    // Validate file size
    const sizeResult = validateFileSize(file, fileType as FileType);
    if (!sizeResult.valid) {
        return sizeResult;
    }

    // Validate MIME type and extension
    const mimeResult = validateMimeType(file, fileType as FileType);
    if (!mimeResult.valid) {
        return mimeResult;
    }

    return { valid: true };
}
