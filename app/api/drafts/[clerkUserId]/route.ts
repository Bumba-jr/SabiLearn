import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraftsByUserId } from '@/lib/db/draft-operations';

/**
 * GET /api/drafts/[clerkUserId]
 * Retrieves all draft metadata for a user
 * 
 * Response:
 * - 200: Array of draft metadata
 * - 401: Unauthorized
 * - 403: Forbidden (user ID mismatch)
 * - 500: Server error
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ clerkUserId: string }> }
) {
    try {
        // Await params in Next.js 15+
        const params = await context.params;
        const { clerkUserId } = params;

        // Verify authentication
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify user ID matches authenticated user
        if (clerkUserId !== userId) {
            return NextResponse.json(
                { error: 'Forbidden: User ID mismatch' },
                { status: 403 }
            );
        }

        // Get all drafts for user
        const drafts = await getDraftsByUserId(clerkUserId);

        return NextResponse.json(
            { drafts },
            { status: 200 }
        );
    } catch (error) {
        console.error('Draft retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
