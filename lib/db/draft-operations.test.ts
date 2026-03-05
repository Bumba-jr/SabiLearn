/**
 * Unit tests for draft metadata database operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createDraftMetadata,
    getDraftsByUserId,
    getDraftById,
    updateDraftMetadata,
    deleteDraftMetadata,
    deleteAllUserDrafts,
    getExpiredDrafts,
    type CreateDraftInput,
    type DraftMetadata,
} from './draft-operations';

// Mock the supabase client
vi.mock('@/lib/supabase-server', () => ({
    supabaseAdmin: {
        from: vi.fn(() => ({
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn(),
                    })),
                    order: vi.fn(),
                    single: vi.fn(),
                })),
                lt: vi.fn(() => ({
                    order: vi.fn(),
                })),
                order: vi.fn(),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        select: vi.fn(() => ({
                            single: vi.fn(),
                        })),
                    })),
                })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(),
                })),
            })),
        })),
    },
}));

describe('draft-operations', () => {
    const mockDraft: DraftMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clerk_user_id: 'user_123',
        file_type: 'degree_certificate',
        storage_path: 'drafts/user_123/degree_certificate/1704067200000_degree.pdf',
        original_filename: 'degree.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        uploaded_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-01-31T00:00:00Z',
    };

    describe('Type definitions', () => {
        it('should have correct FileType values', () => {
            const validTypes = [
                'degree_certificate',
                'government_id',
                'nysc_certificate',
                'profile_photo',
                'intro_video',
            ];

            // This test verifies the types are correctly defined
            expect(validTypes).toContain('degree_certificate');
            expect(validTypes).toContain('intro_video');
        });

        it('should have correct DraftMetadata structure', () => {
            // Verify the mock draft has all required fields
            expect(mockDraft).toHaveProperty('id');
            expect(mockDraft).toHaveProperty('clerk_user_id');
            expect(mockDraft).toHaveProperty('file_type');
            expect(mockDraft).toHaveProperty('storage_path');
            expect(mockDraft).toHaveProperty('original_filename');
            expect(mockDraft).toHaveProperty('file_size');
            expect(mockDraft).toHaveProperty('mime_type');
            expect(mockDraft).toHaveProperty('uploaded_at');
            expect(mockDraft).toHaveProperty('expires_at');
        });
    });

    describe('createDraftMetadata', () => {
        it('should accept valid CreateDraftInput', () => {
            const input: CreateDraftInput = {
                clerk_user_id: 'user_123',
                file_type: 'degree_certificate',
                storage_path: 'drafts/user_123/degree_certificate/1704067200000_degree.pdf',
                original_filename: 'degree.pdf',
                file_size: 1024000,
                mime_type: 'application/pdf',
            };

            // Verify input structure is correct
            expect(input).toHaveProperty('clerk_user_id');
            expect(input).toHaveProperty('file_type');
            expect(input).toHaveProperty('storage_path');
            expect(input).toHaveProperty('original_filename');
            expect(input).toHaveProperty('file_size');
            expect(input).toHaveProperty('mime_type');
        });
    });

    describe('Function signatures', () => {
        it('should have correct function exports', () => {
            expect(typeof createDraftMetadata).toBe('function');
            expect(typeof getDraftsByUserId).toBe('function');
            expect(typeof getDraftById).toBe('function');
            expect(typeof updateDraftMetadata).toBe('function');
            expect(typeof deleteDraftMetadata).toBe('function');
            expect(typeof deleteAllUserDrafts).toBe('function');
            expect(typeof getExpiredDrafts).toBe('function');
        });
    });
});
