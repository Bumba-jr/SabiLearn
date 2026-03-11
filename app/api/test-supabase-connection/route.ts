import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
    console.log('🧪 Testing Supabase connection...');

    const results: any = {
        timestamp: new Date().toISOString(),
        environment: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
        tests: {}
    };

    // Test 1: List buckets
    try {
        console.log('📦 Test 1: Listing storage buckets...');
        const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

        if (error) {
            results.tests.listBuckets = {
                success: false,
                error: error.message,
                details: error
            };
        } else {
            results.tests.listBuckets = {
                success: true,
                buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) || []
            };
        }
    } catch (error) {
        results.tests.listBuckets = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            type: error instanceof Error ? error.name : 'Unknown'
        };
    }

    // Test 2: Check drafts bucket
    try {
        console.log('📁 Test 2: Checking drafts bucket...');
        const { data, error } = await supabaseAdmin.storage.getBucket('drafts');

        if (error) {
            results.tests.draftsBucket = {
                success: false,
                error: error.message,
                details: error
            };
        } else {
            results.tests.draftsBucket = {
                success: true,
                bucket: data
            };
        }
    } catch (error) {
        results.tests.draftsBucket = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            type: error instanceof Error ? error.name : 'Unknown'
        };
    }

    // Test 3: Test database connection
    try {
        console.log('🗄️ Test 3: Testing database connection...');
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('count')
            .limit(1);

        if (error) {
            results.tests.database = {
                success: false,
                error: error.message,
                details: error
            };
        } else {
            results.tests.database = {
                success: true,
                message: 'Database connection successful'
            };
        }
    } catch (error) {
        results.tests.database = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            type: error instanceof Error ? error.name : 'Unknown'
        };
    }

    console.log('✅ Test results:', JSON.stringify(results, null, 2));

    return NextResponse.json(results);
}
