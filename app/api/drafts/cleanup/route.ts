import { NextRequest, NextResponse } from 'next/server';
import { getExpiredDrafts, deleteDraftMetadata } from '@/lib/db/draft-operations';
import { deleteDraftFile } from '@/lib/storage/draft-storage';

/**
 * POST /api/drafts/cleanup
 * Cleanup job for expired drafts
 * Requires admin API key in Authorization header
 * 
 * Response:
 * - 200: { deletedCount: number, errorCount: number, executionTimeMs: number }
 * - 401: Unauthorized (invalid API key)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Verify admin API key
        const authHeader = request.headers.get('authorization');
        const adminApiKey = process.env.ADMIN_API_KEY;

        if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid API key' },
                { status: 401 }
            );
        }

        // Get all expired drafts
        const expiredDrafts = await getExpiredDrafts();

        let deletedCount = 0;
        let errorCount = 0;

        // Process each expired draft
        for (const draft of expiredDrafts) {
            try {
                // Delete file from storage
                await deleteDraftFile(draft.storage_path);

                // Delete metadata
                await deleteDraftMetadata(draft.id, draft.clerk_user_id);

                deletedCount++;

                // Log deletion
                console.log('Draft deleted:', {
                    clerk_user_id: draft.clerk_user_id,
                    file_type: draft.file_type,
                    reason: 'expiration',
                    expired_at: draft.expires_at,
                });
            } catch (error) {
                errorCount++;
                console.error('Failed to delete draft:', {
                    draft_id: draft.id,
                    clerk_user_id: draft.clerk_user_id,
                    file_type: draft.file_type,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                // Continue processing other drafts
            }
        }

        const executionTimeMs = Date.now() - startTime;

        console.log('Cleanup job completed:', {
            deletedCount,
            errorCount,
            executionTimeMs,
        });

        return NextResponse.json(
            {
                deletedCount,
                errorCount,
                executionTimeMs,
            },
            { status: 200 }
        );
    } catch (error) {
        const executionTimeMs = Date.now() - startTime;
        console.error('Cleanup job error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
                executionTimeMs,
            },
            { status: 500 }
        );
    }
}
