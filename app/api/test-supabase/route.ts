import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
    try {
        console.log('Testing Supabase connection...');
        console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

        const { data, error } = await supabaseAdmin
            .from('tutors')
            .select('id, name')
            .limit(1);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
        }

        return NextResponse.json({
            success: true,
            data,
            count: data?.length || 0
        });
    } catch (error) {
        console.error('Catch error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
}
