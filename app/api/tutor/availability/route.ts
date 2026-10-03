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

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function validateAvailability(input: unknown): string | null {
    if (typeof input !== 'object' || input === null) return 'availability must be an object';
    for (const [day, ranges] of Object.entries(input as Record<string, unknown>)) {
        if (!DAYS.includes(day)) return `unknown day: ${day}`;
        if (!Array.isArray(ranges)) return `${day} must be an array`;
        for (const range of ranges) {
            const r = range as { from?: string; to?: string };
            if (!/^\d{2}:\d{2}$/.test(r.from || '') || !/^\d{2}:\d{2}$/.test(r.to || '')) {
                return `${day} ranges must use HH:MM format`;
            }
        }
    }
    return null;
}

// PUT /api/tutor/availability — save the signed-in tutor's weekly availability
export async function PUT(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const invalid = validateAvailability(body?.availability);
        if (invalid) {
            return NextResponse.json({ error: invalid }, { status: 400 });
        }

        const { error } = await supabase
            .from('tutors')
            .update({ availability: body.availability, updated_at: new Date().toISOString() })
            .eq('auth_user_id', user.id);

        if (error) {
            // Column missing (migration not run yet)
            console.error('Availability save error:', error.message);
            return NextResponse.json(
                { error: 'Could not save availability. Ask the admin to run migration 008.' },
                { status: 500 }
            );
        }
        return NextResponse.json({ saved: true });
    } catch (error) {
        console.error('Availability API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
