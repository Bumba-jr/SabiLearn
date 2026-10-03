import { NextRequest, NextResponse } from 'next/server';
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

// POST /api/onboarding/parent — complete parent onboarding
// Body: { firstName, lastName, phone, children: [{ name, gradeLevel }] }
export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const firstName = (body?.firstName || '').toString().trim();
        const lastName = (body?.lastName || '').toString().trim();
        if (!firstName || !lastName) {
            return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
        }

        // Check current profile state first — a DB trigger locks the role once
        // onboarding completes, so handle already-onboarded accounts gracefully.
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, role, onboarding_completed')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (existingProfile?.onboarding_completed && existingProfile.role !== 'parent') {
            return NextResponse.json(
                { error: `This account is already set up as a ${existingProfile.role}. Use a different account to onboard as a parent.` },
                { status: 409 }
            );
        }

        // Mark the profile as a completed parent account
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: 'parent',
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', user.id);

        if (profileError) {
            console.error('Parent profile update error:', profileError.message);
            if (/Cannot change role/i.test(profileError.message)) {
                return NextResponse.json(
                    { error: 'This account already completed onboarding with another role.' },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        const children = Array.isArray(body?.children) ? body.children : [];
        const created = [];
        for (const child of children) {
            const name = (child?.name || '').toString().trim();
            if (!name) continue;

            // Optional child login: parent provides email + password and the
            // account is created AND linked to this parent automatically.
            const email = (child?.email || '').toString().trim().toLowerCase();
            const password = (child?.password || '').toString();
            const wantsAccount = Boolean(email && password);
            let childAuthId: string | null = null;

            if (wantsAccount) {
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                    return NextResponse.json({ error: `Enter a valid email for ${name}` }, { status: 400 });
                }
                if (password.length < 6) {
                    return NextResponse.json({ error: `${name}'s password must be at least 6 characters` }, { status: 400 });
                }
                const { data: authCreated, error: authError } = await supabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: name, account_type: 'child', parent_id: profileRow?.id || null },
                });
                if (authError) {
                    const msg = authError.message || '';
                    if (/already.*(registered|exists)/i.test(msg)) {
                        return NextResponse.json({ error: `${email} already has an account. Use a different email for ${name}.` }, { status: 409 });
                    }
                    console.error('Child auth create error:', msg);
                    return NextResponse.json({ error: `Could not create the login for ${name}` }, { status: 500 });
                }
                childAuthId = authCreated.user!.id;
                await supabase.from('profiles').insert({
                    auth_user_id: childAuthId,
                    role: 'student',
                    onboarding_completed: true,
                });
            }

            const code = await generateChildCode();
            const { data: row, error }: { data: any; error: any } = await supabase
                .from('students')
                .insert({
                    user_id: childAuthId ?? `${user.id}:child:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
                    name,
                    email: childAuthId ? email : `${user.id}+child${Date.now()}${created.length}@parents.sabilearn.local`,
                    grade_level: child?.gradeLevel ? String(child.gradeLevel) : null,
                    parent_id: profileRow?.id || null,
                    child_code: code,
                })
                .select('id, name, grade_level, child_code')
                .single();
            if (error) {
                console.error('Child insert error:', error.message);
                return NextResponse.json(
                    { error: 'Parent accounts need migration 008 to be run first.' },
                    { status: 500 }
                );
            }
            created.push(row);
        }

        return NextResponse.json({ ok: true, children: created });
    } catch (error) {
        console.error('Parent onboarding API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
