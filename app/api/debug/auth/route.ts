import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Debug endpoint to check Clerk authentication
 * GET /api/debug/auth
 */
export async function GET() {
    try {
        const authData = await auth();

        return NextResponse.json({
            authenticated: !!authData.userId,
            userId: authData.userId,
            sessionId: authData.sessionId,
            orgId: authData.orgId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Auth check failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
