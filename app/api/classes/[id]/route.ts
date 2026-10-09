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


// Classes whose booked time is over (started_at + duration + 2 min grace)
// are finalized server-side, so a tutor closing their tab can never leave a
// class stuck "live" with banners showing forever.
const STALE_GRACE_MS = 2 * 60_000;

async function finalizeStaleClasses() {
    const cutoff = Date.now() - 0; // now
    const { data: stale } = await supabase
        .from('classes')
        .select('id, started_at, session:sessions!inner(duration_minutes)')
        .eq('status', 'live');
    for (const c of stale || []) {
        const session = Array.isArray(c.session) ? c.session[0] : c.session;
        const duration = session?.duration_minutes || 60;
        const endMs = new Date(c.started_at).getTime() + duration * 60_000 + STALE_GRACE_MS;
        if (endMs < Date.now()) {
            await supabase
                .from('classes')
                .update({ status: 'ended', ended_at: new Date(Math.min(endMs - STALE_GRACE_MS, Date.now())).toISOString() })
                .eq('id', c.id);
        }
    }
}

// GET /api/classes/[id] — class details + attendance (participants only)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const resolved = await Promise.resolve(params);
        const { id } = resolved;

        // If this class's booked time ran out, finalize it first so the room
        // shows as ended even when no one pressed End Class.
        await finalizeStaleClasses();

        const { data: klass } = await supabase
            .from('classes')
            .select(`
                id, status, started_at, ended_at,
                session:sessions!inner(id, subject, scheduled_at, duration_minutes, location_type, notes, student_id, tutor_id,
                    tutor:tutors(id, name, avatar_url),
                    student:students(id, name, grade_level)
                )
            `)
            .eq('id', id)
            .maybeSingle();

        if (!klass) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        const session = Array.isArray(klass.session) ? klass.session[0] : klass.session;
        const { data: tutorRow } = await supabase
            .from('tutors').select('id').eq('auth_user_id', user.id).maybeSingle();
        const { data: profile } = await supabase
            .from('profiles').select('id, role').eq('auth_user_id', user.id).maybeSingle();

        let studentIds: string[] = [];
        if (profile?.role === 'parent' && profile.id) {
            const { data: kids } = await supabase.from('students').select('id').eq('parent_id', profile.id);
            studentIds = (kids || []).map((k) => k.id);
        } else {
            const { data: own } = await supabase.from('students').select('id').eq('user_id', user.id);
            studentIds = (own || []).map((k) => k.id);
        }

        const isTutor = tutorRow && session.tutor_id === tutorRow.id;
        const isStudentSide = studentIds.includes(session.student_id);
        if (!isTutor && !isStudentSide) {
            return NextResponse.json({ error: 'Not a participant of this class' }, { status: 403 });
        }

        const { data: attendance } = await supabase
            .from('class_attendance')
            .select('student_id, first_joined_at, last_seen_at')
            .eq('class_id', id);

        return NextResponse.json({
            class: { ...klass, session },
            viewer: { isTutor: !!isTutor, studentId: isStudentSide ? session.student_id : null },
            attendance: attendance || [],
        });
    } catch (error) {
        console.error('Class detail API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/classes/[id] — heartbeat presence. Body: { studentId? } (omit = tutor)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const resolved = await Promise.resolve(params);
        const { id } = resolved;

        // If this class's booked time ran out, finalize it first so the room
        // shows as ended even when no one pressed End Class.
        await finalizeStaleClasses();

        const { data: klass } = await supabase
            .from('classes')
            .select('id, status, session:sessions(student_id, tutor_id)')
            .eq('id', id)
            .maybeSingle();
        if (!klass) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }
        const session = Array.isArray(klass.session) ? klass.session[0] : klass.session;

        const body = await req.json().catch(() => ({}));
        const studentId = body?.studentId || null;

        if (studentId) {
            // Student-side presence: verify the caller is the child's parent or the student
            const { data: childRow } = await supabase
                .from('students').select('parent_id, user_id').eq('id', studentId).maybeSingle();
            let allowed = childRow?.user_id === user.id;
            if (!allowed && childRow?.parent_id) {
                const { data: prof } = await supabase
                    .from('profiles').select('auth_user_id').eq('id', childRow.parent_id).maybeSingle();
                allowed = prof?.auth_user_id === user.id;
            }
            if (!allowed) {
                return NextResponse.json({ error: 'Not allowed for this student' }, { status: 403 });
            }
            const { data: existing } = await supabase
                .from('class_attendance')
                .select('id')
                .eq('class_id', id)
                .eq('student_id', studentId)
                .maybeSingle();
            if (existing) {
                await supabase
                    .from('class_attendance')
                    .update({ last_seen_at: new Date().toISOString() })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('class_attendance')
                    .insert({ class_id: id, student_id: studentId });
            }
            return NextResponse.json({ present: true });
        }

        // Tutor presence: just confirm they're the tutor of a live class
        const { data: tutorRow } = await supabase
            .from('tutors').select('id').eq('auth_user_id', user.id).maybeSingle();
        if (!tutorRow || session.tutor_id !== tutorRow.id) {
            return NextResponse.json({ error: 'Not the tutor of this class' }, { status: 403 });
        }
        return NextResponse.json({ tutorPresent: true });
    } catch (error) {
        console.error('Class heartbeat API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/classes/[id] — tutor ends the class; booking marked completed
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const resolved = await Promise.resolve(params);
        const { id } = resolved;

        // If this class's booked time ran out, finalize it first so the room
        // shows as ended even when no one pressed End Class.
        await finalizeStaleClasses();

        const { data: klass } = await supabase
            .from('classes')
            .select('id, status, session:sessions(student_id, tutor_id)')
            .eq('id', id)
            .maybeSingle();
        if (!klass) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }
        const session = Array.isArray(klass.session) ? klass.session[0] : klass.session;

        const { data: tutorRow } = await supabase
            .from('tutors').select('id').eq('auth_user_id', user.id).maybeSingle();
        if (!tutorRow || session.tutor_id !== tutorRow.id) {
            return NextResponse.json({ error: 'Only the tutor can end the class' }, { status: 403 });
        }
        if (klass.status !== 'live') {
            return NextResponse.json({ alreadyEnded: true });
        }

        await supabase
            .from('classes')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', id);

        await supabase
            .from('sessions')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', (session as any).id);

        return NextResponse.json({ ended: true });
    } catch (error) {
        console.error('Class end API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
