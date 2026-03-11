import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/supabase-auth';

/**
 * Debug endpoint to check Supabase authentication
 * GET /api/debug/auth
 */
export async function GET() {
    try {
        const user = await getServerUser();

        return NextResponse.json({
            authenticated: !!user,
            userId: user?.id || null,
            email: user?.email || null,
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
