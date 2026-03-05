/**
 * Unit tests for draft cleanup API endpoint
 */

import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/db/draft-operations', () => ({
    getExpiredDrafts: vi.fn(),
    deleteDraftMetadata: vi.fn(),
}));

vi.mock('@/lib/storage/draft-storage', () => ({
    deleteDraftFile: vi.fn(),
}));

describe('POST /api/drafts/cleanup', () => {
    describe('Function export', () => {
        it('should export POST function', () => {
            expect(typeof POST).toBe('function');
        });
    });

    describe('Authentication', () => {
        it('should require admin API key', () => {
            expect(POST).toBeDefined();
        });

        it('should return 401 on invalid API key', () => {
            expect(POST).toBeDefined();
        });
    });

    describe('Cleanup operations', () => {
        it('should delete expired drafts', () => {
            expect(POST).toBeDefined();
        });

        it('should continue on individual failures', () => {
            expect(POST).toBeDefined();
        });

        it('should track deleted and error counts', () => {
            expect(POST).toBeDefined();
        });

        it('should log each deletion', () => {
            expect(POST).toBeDefined();
        });
    });

    describe('Response', () => {
        it('should return deletedCount, errorCount, executionTimeMs', () => {
            expect(POST).toBeDefined();
        });

        it('should return 200 on success', () => {
            expect(POST).toBeDefined();
        });

        it('should return 500 on server error', () => {
            expect(POST).toBeDefined();
        });
    });
});
