import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraftsByUserId } from '@/lib/db/draft-operations';

/**
 * GET /api/drafts/me
 * Retrieves all draft metadata for the currently authenticated user
 * No user ID parameter needed - uses auth() directly
 */
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('✅ Fetching drafts for authenticated user:', userId);

        const drafts = await getDraftsByUserId(userId);

        return NextResponse.json(
            {
                userId,
                drafts,
                count: drafts.length
            },
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
