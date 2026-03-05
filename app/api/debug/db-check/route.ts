import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * Debug endpoint to check if database table exists
 * GET /api/debug/db-check
 */
export async function GET() {
    try {
        // Try to query the drafts table
        const { data, error } = await supabaseAdmin
            .from('tutor_onboarding_drafts')
            .select('count')
            .limit(1);

        if (error) {
            return NextResponse.json({
                tableExists: false,
                error: error.message,
                hint: 'Run the migration: supabase/migrations/003_tutor_onboarding_drafts.sql'
            });
        }

        // Try to check storage bucket
        const { data: buckets, error: bucketError } = await supabaseAdmin
            .storage
            .listBuckets();

        const draftsBucket = buckets?.find(b => b.name === 'drafts');

        return NextResponse.json({
            tableExists: true,
            bucketExists: !!draftsBucket,
            bucketInfo: draftsBucket || 'Bucket not found',
            status: 'ready'
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Database check failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
