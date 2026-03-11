import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
    try {
        console.log('🧪 Testing Supabase Storage connection...');

        // Test 1: List buckets
        console.log('📦 Listing storage buckets...');
        const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();

        if (bucketsError) {
            console.error('❌ Failed to list buckets:', bucketsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to list buckets',
                details: bucketsError.message
            }, { status: 500 });
        }

        console.log('✅ Buckets:', buckets?.map(b => b.name));

        // Test 2: Check if drafts bucket exists
        const draftsBucket = buckets?.find(b => b.name === 'drafts');
        if (!draftsBucket) {
            return NextResponse.json({
                success: false,
                error: 'Drafts bucket not found',
                availableBuckets: buckets?.map(b => b.name)
            }, { status: 404 });
        }

        // Test 3: List files in drafts bucket
        console.log('📁 Listing files in drafts bucket...');
        const { data: files, error: filesError } = await supabaseAdmin.storage
            .from('drafts')
            .list('', { limit: 10 });

        if (filesError) {
            console.error('❌ Failed to list files:', filesError);
            return NextResponse.json({
                success: false,
                error: 'Failed to list files in drafts bucket',
                details: filesError.message
            }, { status: 500 });
        }

        console.log('✅ Files in drafts:', files?.length);

        return NextResponse.json({
            success: true,
            message: 'Supabase Storage is working correctly',
            buckets: buckets?.map(b => ({ name: b.name, id: b.id, public: b.public })),
            filesInDrafts: files?.length || 0
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Test failed',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
