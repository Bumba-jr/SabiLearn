import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraftById } from '@/lib/db/draft-operations';
import { generateSignedUrl } from '@/lib/storage/draft-storage';

const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * GET /api/drafts/download/[draftId]
 * Generates a signed URL for downloading a draft file
 * 
 * Response:
 * - 200: { signedUrl: string, expiresIn: number }
 * - 401: Unauthorized
 * - 403: Forbidden (user doesn't own draft)
 * - 404: Draft not found
 * - 500: Server error
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ draftId: string }> }
) {
    try {
        // Await params in Next.js 15+
        const params = await context.params;
        const { draftId } = params;

        // Verify authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get draft metadata with ownership check
        const draft = await getDraftById(draftId, userId);

        if (!draft) {
            return NextResponse.json(
                { error: 'Draft not found or access denied' },
                { status: 404 }
            );
        }

        // Generate signed URL
        const signedUrl = await generateSignedUrl(draft.storage_path, SIGNED_URL_EXPIRY);

        return NextResponse.json(
            {
                signedUrl,
                expiresIn: SIGNED_URL_EXPIRY,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Draft download error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
