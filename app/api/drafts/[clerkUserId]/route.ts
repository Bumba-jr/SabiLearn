import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/supabase-auth';
import { getDraftsByUserId } from '@/lib/db/draft-operations';

/**
 * GET /api/drafts/[userId]
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
        const { clerkUserId: requestedUserId } = params;

        console.log('📥 Drafts API called for user:', requestedUserId);

        // Verify authentication
        const user = await getServerUser();

        if (!user) {
            console.log('❌ No authenticated user found');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('✅ Authenticated user:', user.id);

        // Verify user ID matches authenticated user
        if (requestedUserId !== user.id) {
            console.log('❌ User ID mismatch:', { requested: requestedUserId, authenticated: user.id });
            return NextResponse.json(
                { error: 'Forbidden: User ID mismatch' },
                { status: 403 }
            );
        }

        console.log('✅ User ID matches, fetching drafts...');

        // Get all drafts for user
        const drafts = await getDraftsByUserId(user.id);

        console.log('✅ Drafts retrieved:', drafts.length, 'items');

        return NextResponse.json(
            { drafts },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Draft retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
