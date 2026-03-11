import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/supabase-auth';
import { getDraftsByUserId, deleteDraftMetadata, type FileType } from '@/lib/db/draft-operations';
import { deleteDraftFile } from '@/lib/storage/draft-storage';

/**
 * DELETE /api/drafts/[userId]/[fileType]
 * Deletes a draft file and its metadata
 * 
 * Response:
 * - 200: Draft deleted successfully
 * - 401: Unauthorized
 * - 403: Forbidden (user ID mismatch)
 * - 404: Draft not found
 * - 500: Server error
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ clerkUserId: string; fileType: string }> }
) {
    try {
        // Await params in Next.js 15+
        const params = await context.params;
        const { clerkUserId: requestedUserId, fileType } = params;

        // Verify authentication
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify user ID matches authenticated user
        if (requestedUserId !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden: User ID mismatch' },
                { status: 403 }
            );
        }

        // Find the draft
        const drafts = await getDraftsByUserId(user.id);
        const draft = drafts.find(d => d.file_type === fileType as FileType);

        if (!draft) {
            return NextResponse.json(
                { error: 'Draft not found' },
                { status: 404 }
            );
        }

        // Begin transaction-like operation: delete file, then metadata
        try {
            // Delete file from storage
            await deleteDraftFile(draft.storage_path);

            // Delete metadata
            await deleteDraftMetadata(draft.id, user.id);

            return NextResponse.json(
                { message: 'Draft deleted successfully' },
                { status: 200 }
            );
        } catch (error) {
            // If deletion fails, log but don't rollback (file might already be gone)
            console.error('Draft deletion error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Draft deletion error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
