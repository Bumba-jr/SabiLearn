import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { generateChildCode } from '@/lib/child-code';

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


// PATCH /api/parent/children — manage a child: { childId, name?, gradeLevel?, password? }
export async function PATCH(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const childId = body?.childId;
        if (!childId) {
            return NextResponse.json({ error: 'childId is required' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        // The child must belong to this parent
        const { data: child } = await supabase
            .from('students')
            .select('id, name, user_id, email, parent_id')
            .eq('id', childId)
            .maybeSingle();
        if (!child || child.parent_id !== profile?.id) {
            return NextResponse.json({ error: 'That child is not on your account.' }, { status: 403 });
        }

        // Update profile details
        const updates: any = {};
        if (body?.name && body.name.toString().trim()) updates.name = body.name.toString().trim();
        if (body?.gradeLevel) updates.grade_level = String(body.gradeLevel);
        if (Object.keys(updates).length > 0) {
            const { error: updError } = await supabase
                .from('students')
                .update(updates)
                .eq('id', child.id);
            if (updError) {
                console.error('Child update error:', updError.message);
                return NextResponse.json({ error: 'Could not update the details' }, { status: 500 });
            }
        }

        // Change the child's account password
        if (body?.password) {
            const password = body.password.toString();
            if (password.length < 6) {
                return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
            }
            if (!/^[0-9a-f-]{36}$/i.test(child.user_id)) {
                return NextResponse.json(
                    { error: 'This child has no login account yet — use Add Child with an email and password to create one.' },
                    { status: 400 }
                );
            }
            const { error: pwError } = await supabase.auth.admin.updateUserById(child.user_id, { password });
            if (pwError) {
                console.error('Child password update error:', pwError.message);
                return NextResponse.json({ error: 'Could not change the password' }, { status: 500 });
            }
        }

        return NextResponse.json({ updated: true });
    } catch (error) {
        console.error('Child PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/parent/children — the signed-in parent's children (with codes)
export async function GET(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const includeCode = searchParams.get('withCode') === '1' || isAdminUser(user.id);

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
        if (!profile) {
            return NextResponse.json({ children: [] });
        }

        const { data: children, error } = await supabase
            .from('students')
            .select('id, name, email, grade_level, child_code, created_at')
            .eq('parent_id', profile.id);

        if (error) {
            console.error('Children fetch error:', error.message);
            return NextResponse.json({
                children: [],
                notice: 'Child codes need migration 011 to be run.',
            });
        }

        return NextResponse.json({ children: children || [] });
    } catch (error) {
        console.error('Parent children API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/parent/children — add a child, optionally with their own login account.
// Body: { name, gradeLevel, email?, password? }
export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const name = (body?.name || '').toString().trim();
        if (!name) {
            return NextResponse.json({ error: "Child's name is required" }, { status: 400 });
        }

        const email = (body?.email || '').toString().trim().toLowerCase();
        const password = (body?.password || '').toString();
        const wantsAccount = Boolean(email && password);

        if (wantsAccount) {
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                return NextResponse.json({ error: 'Enter a valid email for the child' }, { status: 400 });
            }
            if (password.length < 6) {
                return NextResponse.json({ error: 'Child password must be at least 6 characters' }, { status: 400 });
            }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const code = await generateChildCode();

        // With account: create a real auth user so the child can log in
        let childAuthId: string | null = null;
        if (wantsAccount) {
            const { data: created, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name, account_type: 'child', parent_id: profile.id },
            });
            if (createError) {
                const msg = createError.message || '';
                if (/already.*(registered|exists)/i.test(msg)) {
                    return NextResponse.json(
                        { error: 'That email already has an account. Use a different email for this child.' },
                        { status: 409 }
                    );
                }
                console.error('Child auth create error:', msg);
                return NextResponse.json({ error: 'Could not create the child account' }, { status: 500 });
            }
            childAuthId = created.user!.id;

            // Profile so /dashboard routes them to the student dashboard
            await supabase.from('profiles').insert({
                auth_user_id: childAuthId,
                role: 'student',
                onboarding_completed: true,
            });
        }

        const { data: child, error } = await supabase
            .from('students')
            .insert({
                user_id: childAuthId ?? `${user.id}:child:${Date.now()}`,
                name,
                email: childAuthId ? email : `${user.id}+child${Date.now()}@parents.sabilearn.local`,
                grade_level: body?.gradeLevel ? String(body.gradeLevel) : null,
                parent_id: profile.id,
                child_code: code,
            })
            .select('id, name, grade_level, child_code')
            .single();

        if (error) {
            console.error('Child create error:', error.message);
            if (/child_code/i.test(error.message)) {
                return NextResponse.json({ error: 'Child codes need migration 011 to be run first.' }, { status: 500 });
            }
            return NextResponse.json({ error: 'Could not add child' }, { status: 500 });
        }

        return NextResponse.json({
            child,
            accountCreated: wantsAccount,
            loginEmail: wantsAccount ? email : null,
        });
    } catch (error) {
        console.error('Parent children API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
