import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// PUT /api/tutor/rate — the tutor sets or updates their hourly price.
export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const rate = Number(body?.hourlyRate);
        if (!Number.isFinite(rate) || rate < 0 || rate > 1_000_000) {
            return NextResponse.json({ error: 'Enter an hourly rate between ₦0 and ₦1,000,000' }, { status: 400 });
        }

        const { data: tutor } = await supabaseAdmin
            .from('tutors')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();
        if (!tutor) {
            return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('tutors')
            .update({ hourly_rate: rate, updated_at: new Date().toISOString() })
            .eq('id', tutor.id);
        if (error) {
            console.error('Error updating tutor rate:', error);
            return NextResponse.json({ error: 'Could not save your rate' }, { status: 500 });
        }

        return NextResponse.json({ ok: true, hourly_rate: rate });
    } catch (error) {
        console.error('Error in tutor rate PUT:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
