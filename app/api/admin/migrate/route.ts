import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        // Simple auth check
        const { password } = await request.json();

        if (password !== 'migrate-experiences-2024') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // We can't run raw SQL directly, but we can update the schema through a workaround
        // Let's just update existing tutors to have an empty experiences array
        console.log('Updating existing tutors with empty experiences array...');

        // First, get all tutors
        const { data: tutors, error: fetchError } = await supabase
            .from('tutors')
            .select('id');

        if (fetchError) {
            return NextResponse.json({
                error: 'Failed to fetch tutors',
                details: fetchError
            }, { status: 500 });
        }

        console.log(`Found ${tutors?.length || 0} tutors`);

        return NextResponse.json({
            message: 'Migration endpoint ready',
            info: 'Please run the SQL migration manually in Supabase SQL Editor',
            sql: `
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);
COMMENT ON COLUMN tutors.experiences IS 'Array of teaching experience objects';
            `,
            tutorsCount: tutors?.length || 0
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
