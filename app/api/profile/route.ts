import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized - No auth header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { authUserId, role } = body;

        if (user.id !== authUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!['tutor', 'student', 'parent'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const { data: existing } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', authUserId)
            .single();

        if (existing) {
            if (!existing.onboarding_completed) {
                const { data: updated, error: updateError } = await supabase
                    .from('profiles')
                    .update({ role, updated_at: new Date().toISOString() })
                    .eq('auth_user_id', authUserId)
                    .select()
                    .single();

                if (updateError) {
                    return NextResponse.json({ error: updateError.message }, { status: 500 });
                }

                await supabase
                    .from('onboarding_progress')
                    .delete()
                    .eq('auth_user_id', authUserId);

                return NextResponse.json(updated);
            }
            return NextResponse.json(existing);
        }

        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
                auth_user_id: authUserId,
                role,
                onboarding_completed: false,
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json(newProfile);
    } catch (error) {
        console.error('Profile API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ profile: null });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
