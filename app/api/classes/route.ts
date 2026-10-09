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

function missingTable(error: { message?: string } | null): boolean {
    return /relation .* does not exist|Could not find the table/i.test(error?.message || '');
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

// GET /api/classes — live classes relevant to the caller
// (as tutor: their classes; as parent: their children's classes; as student: their own)
export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        // Resolve which student rows belong to the caller
        let studentIds: string[] = [];
        if (profile?.role === 'parent' && profile.id) {
            const { data: kids } = await supabase
                .from('students')
                .select('id, name')
                .eq('parent_id', profile.id);
            studentIds = (kids || []).map((k) => k.id);
        } else {
            const { data: own } = await supabase
                .from('students')
                .select('id, name')
                .eq('user_id', user.id);
            studentIds = (own || []).map((k) => k.id);
        }

        // Tutor row
        const { data: tutorRow } = await supabase
            .from('tutors')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        // Close any classes whose booked time ran out before filtering.
        await finalizeStaleClasses();

        // Live classes relevant to the caller. PostgREST can't filter on
        // embedded-resource columns inside .or(), so fetch live classes and
        // filter by ownership in memory (the volume is small).
        const { data: classes, error } = await supabase
            .from('classes')
            .select(`
                id, status, started_at,
                session:sessions!inner(id, subject, scheduled_at, duration_minutes, student_id, tutor_id,
                    tutor:tutors(id, name, avatar_url),
                    student:students(id, name)
                ),
                attendance:class_attendance(student_id, first_joined_at, last_seen_at)
            `)
            .eq('status', 'live');

        if (error) {
            if (missingTable(error)) {
                return NextResponse.json({ liveClasses: [], notice: 'Run migration 010 to enable live classes.' });
            }
            console.error('Live classes fetch error:', error.message);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }

        const relevant = (classes || []).filter((c: any) => {
            const session = Array.isArray(c.session) ? c.session[0] : c.session;
            if (!session) return false;
            if (tutorRow && session.tutor_id === tutorRow.id) return true;
            return studentIds.includes(session.student_id);
        });

        return NextResponse.json({ liveClasses: relevant });
    } catch (error) {
        console.error('Classes API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/classes — the tutor starts a class for an accepted booking. Body: { bookingId }
export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const bookingId = body?.bookingId || null;
        const adHocStudentId = body?.studentId || null;
        if (!bookingId && !adHocStudentId) {
            return NextResponse.json({ error: 'bookingId or studentId is required' }, { status: 400 });
        }

        const { data: tutorRow } = await supabase
            .from('tutors')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
        if (!tutorRow) {
            return NextResponse.json({ error: 'Only tutors can start classes' }, { status: 403 });
        }

        let booking: any = null;

        if (bookingId) {
            const { data } = await supabase
                .from('sessions')
                .select('id, status, tutor_id, student_id')
                .eq('id', bookingId)
                .single();
            if (!data || data.tutor_id !== tutorRow.id) {
                return NextResponse.json({ error: 'Booking not found for this tutor' }, { status: 404 });
            }
            if (data.status !== 'accepted') {
                return NextResponse.json({ error: 'Only accepted bookings can start a class' }, { status: 400 });
            }
            booking = data;
        } else {
            // Ad-hoc class: create a session on the fly for the chosen student
            const { data: studentRow } = await supabase
                .from('students')
                .select('id')
                .eq('id', adHocStudentId)
                .single();
            if (!studentRow) {
                return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            }
            const { data: createdSession, error: sessionError } = await supabase
                .from('sessions')
                .insert({
                    tutor_id: tutorRow.id,
                    student_id: studentRow.id,
                    subject: body?.subject || 'Instant class',
                    scheduled_at: new Date().toISOString(),
                    duration_minutes: Number(body?.durationMinutes) || 60,
                    status: 'accepted',
                    location_type: 'online',
                    amount: 0,
                    payment_status: 'unpaid',
                    notes: body?.notes || 'Started instantly by the tutor',
                })
                .select('id, status, tutor_id, student_id')
                .single();
            if (sessionError) {
                console.error('Ad-hoc session create error:', sessionError.message);
                return NextResponse.json({ error: 'Could not create the instant class' }, { status: 500 });
            }
            booking = createdSession;
        }

        // Reuse an existing live class for this booking
        const { data: existing } = await supabase
            .from('classes')
            .select('id')
            .eq('session_id', booking.id)
            .eq('status', 'live')
            .maybeSingle();
        if (existing) {
            return NextResponse.json({ classId: existing.id, alreadyLive: true });
        }

        const { data: klass, error } = await supabase
            .from('classes')
            .insert({ session_id: booking.id, tutor_id: tutorRow.id, status: 'live' })
            .select('id')
            .single();

        if (error) {
            if (error.code === '23505') {
                // unique(session_id) hit — fetch the live one
                const { data: live } = await supabase
                    .from('classes').select('id').eq('session_id', booking.id).eq('status', 'live').maybeSingle();
                if (live) return NextResponse.json({ classId: live.id, alreadyLive: true });
            }
            console.error('Class create error:', error.message);
            return NextResponse.json({ error: 'Could not start the class. Run migration 010.' }, { status: 500 });
        }

        return NextResponse.json({ classId: klass.id });
    } catch (error) {
        console.error('Classes API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
