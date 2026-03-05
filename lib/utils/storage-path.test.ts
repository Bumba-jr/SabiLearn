/**
 * Unit tests for storage path utility
 */

import { describe, it, expect } from 'vitest';
import {
    sanitizeFilename,
    generateStoragePath,
    parseStoragePath
} from './storage-path';

describe('sanitizeFilename', () => {
    it('should remove special characters and preserve extension', () => {
        expect(sanitizeFilename('My Degree (2023).pdf')).toBe('My_Degree_2023.pdf');
        expect(sanitizeFilename('photo@#$%.jpg')).toBe('photo.jpg');
    });

    it('should replace spaces with underscores', () => {
        expect(sanitizeFilename('my file name.pdf')).toBe('my_file_name.pdf');
    });

    it('should handle multiple consecutive spaces', () => {
        expect(sanitizeFilename('my    file.pdf')).toBe('my_file.pdf');
    });

    it('should handle files without extensions', () => {
        expect(sanitizeFilename('myfile')).toBe('myfile');
    });

    it('should handle empty filename after sanitization', () => {
        expect(sanitizeFilename('@#$%.pdf')).toBe('file.pdf');
    });

    it('should lowercase the extension', () => {
        expect(sanitizeFilename('document.PDF')).toBe('document.pdf');
    });

    it('should remove leading and trailing underscores', () => {
        expect(sanitizeFilename('_file_.pdf')).toBe('file.pdf');
    });
});

describe('generateStoragePath', () => {
    it('should generate correct path format', () => {
        const path = generateStoragePath(
            'user_123',
            'degree_certificate',
            'my degree.pdf',
            1704067200000
        );
        expect(path).toBe('drafts/user_123/degree_certificate/1704067200000_my_degree.pdf');
    });

    it('should sanitize filename in path', () => {
        const path = generateStoragePath(
            'user_456',
            'profile_photo',
            'photo@#$%.jpg',
            1704067200000
        );
        expect(path).toBe('drafts/user_456/profile_photo/1704067200000_photo.jpg');
    });

    it('should use current timestamp if not provided', () => {
        const before = Date.now();
        const path = generateStoragePath('user_789', 'intro_video', 'video.mp4');
        const after = Date.now();

        // Extract timestamp from path
        const match = path.match(/\/(\d+)_/);
        expect(match).toBeTruthy();
        const timestamp = parseInt(match![1], 10);

        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should handle all file types', () => {
        const fileTypes = [
            'degree_certificate',
            'government_id',
            'nysc_certificate',
            'profile_photo',
            'intro_video'
        ] as const;

        fileTypes.forEach(fileType => {
            const path = generateStoragePath('user_123', fileType, 'file.pdf', 1704067200000);
            expect(path).toContain(`/${fileType}/`);
        });
    });
});

describe('parseStoragePath', () => {
    it('should parse valid storage path', () => {
        const result = parseStoragePath(
            'drafts/user_123/degree_certificate/1704067200000_degree.pdf'
        );
        expect(result).toEqual({
            clerkId: 'user_123',
            fileType: 'degree_certificate',
            filename: '1704067200000_degree.pdf'
        });
    });

    it('should return null for invalid format', () => {
        expect(parseStoragePath('invalid/path')).toBeNull();
        expect(parseStoragePath('drafts/user_123')).toBeNull();
        expect(parseStoragePath('wrong/user_123/degree_certificate/file.pdf')).toBeNull();
    });

    it('should return null for invalid file type', () => {
        const result = parseStoragePath('drafts/user_123/invalid_type/1704067200000_file.pdf');
        expect(result).toBeNull();
    });

    it('should parse all valid file types', () => {
        const fileTypes = [
            'degree_certificate',
            'government_id',
            'nysc_certificate',
            'profile_photo',
            'intro_video'
        ] as const;

        fileTypes.forEach(fileType => {
            const result = parseStoragePath(`drafts/user_123/${fileType}/1704067200000_file.pdf`);
            expect(result).toBeTruthy();
            expect(result?.fileType).toBe(fileType);
        });
    });

    it('should extract clerk_id correctly', () => {
        const result = parseStoragePath(
            'drafts/user_abc_123/profile_photo/1704067200000_photo.jpg'
        );
        expect(result?.clerkId).toBe('user_abc_123');
    });
});
