import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function getAuthUser(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/favorites — the signed-in user's saved tutor ids
export async function GET(req: Request) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('favorites')
            .select('tutor_id')
            .eq('user_id', user.id);

        if (error) {
            // Table not migrated yet — report so the client can fall back to localStorage
            console.error('Error fetching favorites:', error.message);
            return NextResponse.json({ error: 'Favorites are not available yet' }, { status: 501 });
        }

        return NextResponse.json({ tutorIds: (data || []).map((f) => f.tutor_id) });
    } catch (error) {
        console.error('Error in favorites GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/favorites — toggle a tutor in the user's favorites. Body: { tutorId }
export async function POST(req: Request) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { tutorId } = body;
        if (!tutorId) {
            return NextResponse.json({ error: 'tutorId is required' }, { status: 400 });
        }

        const { data: existing } = await supabaseAdmin
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('tutor_id', tutorId)
            .single();

        if (existing) {
            const { error: deleteError } = await supabaseAdmin
                .from('favorites')
                .delete()
                .eq('id', existing.id);
            if (deleteError) {
                console.error('Error removing favorite:', deleteError);
                return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
            }
            return NextResponse.json({ saved: false });
        }

        const { error: insertError } = await supabaseAdmin
            .from('favorites')
            .insert({ user_id: user.id, tutor_id: tutorId });

        if (insertError) {
            console.error('Error adding favorite:', insertError);
            return NextResponse.json({ error: 'Favorites are not available yet' }, { status: 501 });
        }

        return NextResponse.json({ saved: true });
    } catch (error) {
        console.error('Error in favorites POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
