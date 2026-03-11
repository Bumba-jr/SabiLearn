import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/supabase-auth';
import { getDraftsByUserId } from '@/lib/db/draft-operations';

/**
 * GET /api/drafts/me
 * Retrieves all draft metadata for the authenticated user
 * 
 * Response:
 * - 200: Array of draft metadata
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all drafts for user
        const drafts = await getDraftsByUserId(user.id);

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
