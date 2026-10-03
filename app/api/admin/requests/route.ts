import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { /* middleware refreshes the session */ },
            },
        }
    );
    const { data: { user } } = await supabaseSSR.auth.getUser();
    return user;
}

function isAdminUser(userId: string) {
    return userId === process.env.ADMIN_USER_ID;
}

async function displayNameFor(userId: string): Promise<string> {
    const { data: tutor } = await supabase.from('tutors').select('name').eq('auth_user_id', userId).maybeSingle();
    if (tutor?.name) return tutor.name;
    const { data: student } = await supabase.from('students').select('name').eq('user_id', userId).maybeSingle();
    if (student?.name) return student.name;
    const { data: profile } = await supabase.from('profiles').select('role').eq('auth_user_id', userId).maybeSingle();
    return profile?.role ? `A ${profile.role}` : 'SabiLearn user';
}

// GET /api/admin/requests — all requests (admin), or ?userId= for one user
export async function GET(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const adminOnly = searchParams.get('all') === '1';

        if (adminOnly && !isAdminUser(user.id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let query = supabase
            .from('admin_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (!adminOnly) {
            query = query.eq('user_id', user.id);
        } else if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Requests fetch error:', error.message);
            return NextResponse.json({ requests: [], notice: 'Run migration 009 to enable admin requests.' });
        }

        // Attach names
        const withNames = await Promise.all((data || []).map(async (r) => ({
            ...r,
            userName: await displayNameFor(r.user_id),
        })));

        return NextResponse.json({ requests: withNames });
    } catch (error) {
        console.error('Admin requests API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/requests — create a request for a user (admin only)
// Body: { userId, type: 'document_request' | 'info_request', message }
export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user || !isAdminUser(user.id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const targetUserId = body?.userId;
        const message = (body?.message || '').toString().trim();
        const type = ['document_request', 'info_request'].includes(body?.type) ? body.type : 'document_request';

        if (!targetUserId || !message) {
            return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
        }

        const { data: request, error } = await supabase
            .from('admin_requests')
            .insert({
                user_id: targetUserId,
                type,
                message,
                created_by: user.id,
            })
            .select('*')
            .single();

        if (error) {
            console.error('Request create error:', error.message);
            return NextResponse.json({ error: 'Could not create the request. Run migration 009.' }, { status: 500 });
        }

        return NextResponse.json({ request: { ...request, userName: await displayNameFor(targetUserId) } });
    } catch (error) {
        console.error('Admin requests API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/requests — resolve a request (admin only). Body: { id }
export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user || !isAdminUser(user.id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        if (!body?.id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('admin_requests')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', body.id)
            .select('*')
            .single();

        if (error) {
            console.error('Request update error:', error.message);
            return NextResponse.json({ error: 'Could not resolve the request' }, { status: 500 });
        }

        return NextResponse.json({ request: data });
    } catch (error) {
        console.error('Admin requests API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
