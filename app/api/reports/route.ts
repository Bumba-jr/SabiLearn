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

const REPORT_SELECT = `
    id, reporter_id, reporter_role, tutor_id, reason, details, status, created_at,
    tutor:tutors(id, name, avatar_url)
`;

// GET /api/reports — admin: all reports (?status=open). Non-admin: their own.
export async function GET(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const admin = isAdminUser(user.id);

        let query = supabase
            .from('reports')
            .select(REPORT_SELECT)
            .order('created_at', { ascending: false })
            .limit(100);

        if (!admin) {
            query = query.eq('reporter_id', user.id);
        } else if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Reports fetch error:', error.message);
            return NextResponse.json({ reports: [], notice: 'Run migration 009 to enable reports.' });
        }

        // Attach reporter names
        const withNames = await Promise.all((data || []).map(async (r: any) => {
            let reporterName = 'A user';
            if (r.reporter_role === 'tutor') {
                const { data: t } = await supabase.from('tutors').select('name').eq('auth_user_id', r.reporter_id).maybeSingle();
                reporterName = t?.name || reporterName;
            } else {
                const { data: s } = await supabase.from('students').select('name').eq('user_id', r.reporter_id).maybeSingle();
                reporterName = s?.name || reporterName;
            }
            return { ...r, reporterName };
        }));

        return NextResponse.json({ reports: withNames });
    } catch (error) {
        console.error('Reports API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/reports — a signed-in user reports a tutor. Body: { tutorId, reason, details }
const REASONS = [
    'Inappropriate behavior',
    'Did not show up',
    'Misrepresentation / fake credentials',
    'Pricing or payment issue',
    'Poor teaching quality',
    'Safety concern',
    'Other',
];

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Sign in to report a tutor.' }, { status: 401 });
        }

        const body = await req.json();
        const tutorId = body?.tutorId;
        const reason = REASONS.includes(body?.reason) ? body.reason : null;
        const details = (body?.details || '').toString().trim().slice(0, 2000);

        if (!tutorId || !reason) {
            return NextResponse.json({ error: 'Choose a reason for the report.' }, { status: 400 });
        }
        if (!details) {
            return NextResponse.json({ error: 'Tell us what happened (details are required).' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        const { data: report, error } = await supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                reporter_role: profile?.role || null,
                tutor_id: tutorId,
                reason,
                details,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Report create error:', error.message);
            return NextResponse.json({ error: 'Could not file the report. Run migration 009.' }, { status: 500 });
        }

        return NextResponse.json({ report });
    } catch (error) {
        console.error('Reports API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/reports — admin updates status. Body: { id, status: 'open'|'reviewing'|'resolved' }
export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user || !isAdminUser(user.id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        if (!body?.id || !['open', 'reviewing', 'resolved'].includes(body?.status)) {
            return NextResponse.json({ error: 'id and a valid status are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('reports')
            .update({ status: body.status })
            .eq('id', body.id)
            .select('*')
            .single();

        if (error) {
            console.error('Report update error:', error.message);
            return NextResponse.json({ error: 'Could not update the report' }, { status: 500 });
        }

        return NextResponse.json({ report: data });
    } catch (error) {
        console.error('Reports API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
