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
                setAll() {
                    // Route handlers can't always set cookies; session refresh is
                    // handled by the middleware/proxy.
                },
            },
        }
    );
    const { data: { user } } = await supabaseSSR.auth.getUser();
    return user;
}

// GET /api/onboarding/progress — the signed-in user's saved tutor form progress
export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('onboarding_progress')
            .select('form_data, last_saved_at')
            .eq('auth_user_id', user.id)
            .maybeSingle();
        if (error) {
            // Table/column missing (migration not run yet) — treat as no progress
            console.error('Progress load error:', error.message);
            return NextResponse.json({ progress: null });
        }
        return NextResponse.json({ progress: data });
    } catch (error) {
        console.error('Progress API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/onboarding/progress — auto-save the tutor form progress
export async function PUT(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { formData, step, role } = body;
        if (!formData || typeof formData !== 'object') {
            return NextResponse.json({ error: 'formData is required' }, { status: 400 });
        }
        const safeRole = ['tutor', 'student', 'parent'].includes(role) ? role : 'tutor';

        const { error } = await supabase
            .from('onboarding_progress')
            .upsert(
                {
                    auth_user_id: user.id,
                    role: safeRole,
                    form_data: { ...formData, step },
                    last_saved_at: new Date().toISOString(),
                },
                { onConflict: 'auth_user_id' }
            );

        if (error) {
            console.error('Progress save error:', error.message);
            return NextResponse.json({ saved: false }, { status: 200 });
        }
        return NextResponse.json({ saved: true });
    } catch (error) {
        console.error('Progress API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
