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

// POST /api/student/claim-code — a child who signed up on their own enters
// their family code (SB-XXXXXX) to claim their student record: linking their
// login to the child row the parent created (inheriting lessons + parent link).
export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const code = (body?.code || '').toString().trim().toUpperCase();
        if (!/^SB-[A-Z0-9]{6}$/.test(code)) {
            return NextResponse.json({ error: 'Enter a valid code (looks like SB-4K7Q2M).' }, { status: 400 });
        }

        const { data: row } = await supabase
            .from('students')
            .select('id, name, user_id, parent_id, child_code')
            .eq('child_code', code)
            .maybeSingle();

        if (!row) {
            return NextResponse.json({ error: 'No child found with that code. Ask your parent to share it from their dashboard.' }, { status: 404 });
        }

        // Already claimed by a real account that isn't this one?
        const claimedByOther = row.user_id && !row.user_id.includes(':child:') && row.user_id !== user.id;
        if (claimedByOther) {
            return NextResponse.json({ error: 'That code has already been used by another account.' }, { status: 409 });
        }

        // Attach this login to the child row
        const { error: updateError } = await supabase
            .from('students')
            .update({ user_id: user.id, email: user.email })
            .eq('id', row.id);

        if (updateError) {
            console.error('Claim update error:', updateError.message);
            return NextResponse.json({ error: 'Could not link the code' }, { status: 500 });
        }

        // Make sure the profile routes them to the student dashboard
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, onboarding_completed')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (profile && !profile.role) {
            await supabase
                .from('profiles')
                .update({ role: 'student', onboarding_completed: true, updated_at: new Date().toISOString() })
                .eq('id', profile.id);
        } else if (!profile) {
            await supabase.from('profiles').insert({
                auth_user_id: user.id,
                role: 'student',
                onboarding_completed: true,
            });
        }

        return NextResponse.json({ linked: true, childName: row.name });
    } catch (error) {
        console.error('Claim code API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
