import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { calcLessonPlan, type PlanPeriod } from '@/lib/lesson-plan';

// Helper: verify the bearer token and return the auth user
async function getAuthUser(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/bookings — bookings for the signed-in user (as student or as tutor)
export async function GET(req: Request) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const view = searchParams.get('view'); // 'tutor' to fetch incoming requests

        // Resolve the user's role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

        let query = supabaseAdmin
            .from('sessions')
            .select(`
                *,
                tutor:tutors(id, name, avatar_url, location, hourly_rate),
                student:students(id, name, email)
            `)
            .order('created_at', { ascending: false });

        if (view === 'tutor') {
            // Incoming requests for this tutor
            const { data: tutorRow } = await supabaseAdmin
                .from('tutors')
                .select('id')
                .eq('auth_user_id', user.id)
                .single();

            if (!tutorRow) {
                return NextResponse.json({ bookings: [] });
            }
            query = query.eq('tutor_id', tutorRow.id);
        } else {
            // Bookings this user made (students.user_id stores the auth uuid as text)
            const { data: studentRow } = await supabaseAdmin
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!studentRow) {
                return NextResponse.json({ bookings: [], role: profile?.role || null });
            }
            query = query.eq('student_id', studentRow.id);
        }

        const { data: bookings, error } = await query;

        if (error) {
            console.error('Error fetching bookings:', error);
            return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
        }

        return NextResponse.json({ bookings: bookings || [], role: profile?.role || null });
    } catch (error) {
        console.error('Error in bookings API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/bookings — create a booking request
export async function POST(req: Request) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { tutorId, subject, scheduledAt, durationMinutes, mode, address, notes } = body;
        // Lesson-plan fields: bookings can be a one-off lesson or a recurring
        // plan billed weekly/monthly/yearly. hoursPerSession wins over the
        // legacy durationMinutes when present.
        const legacyMinutes = Number(durationMinutes) > 0 ? Number(durationMinutes) : 60;
        const hoursPerSession = Number(body?.hoursPerSession) > 0
            ? Number(body.hoursPerSession)
            : Math.round((legacyMinutes / 60) * 2) / 2;
        const sessionsPerWeek = Number(body?.sessionsPerWeek) > 0 ? Math.min(7, Math.round(Number(body.sessionsPerWeek))) : 1;
        const planPeriod: PlanPeriod = ['single', 'weekly', 'monthly', 'yearly'].includes(body?.planPeriod)
            ? body.planPeriod
            : 'single';

        if (!tutorId || !subject || !scheduledAt) {
            return NextResponse.json(
                { error: 'Tutor, subject, and date/time are required' },
                { status: 400 }
            );
        }

        // Tutor must exist, be verified and available
        const { data: tutor, error: tutorError } = await supabaseAdmin
            .from('tutors')
            .select('id, name, hourly_rate, is_verified, is_available')
            .eq('id', tutorId)
            .single();

        if (tutorError || !tutor) {
            return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
        }
        if (!tutor.is_verified) {
            return NextResponse.json({ error: 'This tutor is not verified yet' }, { status: 400 });
        }
        if (!tutor.is_available) {
            return NextResponse.json({ error: 'This tutor is not accepting bookings' }, { status: 400 });
        }

        // Parents book on behalf of a specific child; students book for themselves.
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        let studentRow: { id: string } | null = null;
        let bookedForChildName: string | null = null;

        if (profile?.role === 'parent') {
            const childId = body?.childId;
            if (!childId) {
                return NextResponse.json(
                    { error: 'Choose which child this lesson is for.' },
                    { status: 400 }
                );
            }
            const { data: child, error: childError } = await supabaseAdmin
                .from('students')
                .select('id, name, parent_id')
                .eq('id', childId)
                .maybeSingle();

            if (childError || !child || child.parent_id !== profile.id) {
                return NextResponse.json({ error: 'That child is not on your account.' }, { status: 403 });
            }
            studentRow = { id: child.id };
            bookedForChildName = child.name;
        } else {
            let { data: existing } = await supabaseAdmin
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!existing) {
                const { data: created, error: createError } = await supabaseAdmin
                    .from('students')
                    .insert({
                        user_id: user.id,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
                        email: user.email,
                        phone: user.user_metadata?.phone || null,
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating student record:', createError);
                    return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 });
                }
                existing = created;
            }
            studentRow = existing;
        }

        // Price the booking from the tutor's hourly rate. The sessions table
        // requires a non-null amount, so tutors without a rate default to 0
        // (payment is settled after the tutor confirms).
        const duration = hoursPerSession ? Math.round(hoursPerSession * 60) : 60;
        const plan = calcLessonPlan({
            hourlyRate: tutor.hourly_rate || 0,
            hoursPerSession: hoursPerSession || 1,
            sessionsPerWeek,
            period: planPeriod,
        });

        const baseInsert = {
            tutor_id: tutor.id,
            student_id: studentRow.id,
            subject,
            scheduled_at: new Date(scheduledAt).toISOString(),
            duration_minutes: duration,
            status: 'pending',
            location_type: mode === 'home' ? 'home' : 'online',
            location_address: address || null,
            payment_status: 'unpaid',
            notes: notes || null,
        };

        const selectBooking = `
            *,
            tutor:tutors(id, name, avatar_url, location, hourly_rate),
            student:students(id, name, email)
        `;

        // Plan bookings store their period + total for the checkout page. If the
        // plan columns don't exist yet (migration 013 not applied), fall back to
        // a plain single-lesson booking priced per session.
        let booking = null;
        let insertError = null;
        if (planPeriod !== 'single') {
            ({ data: booking, error: insertError } = await supabaseAdmin
                .from('sessions')
                .insert({
                    ...baseInsert,
                    amount: plan.total,
                    plan_period: planPeriod,
                    sessions_per_week: sessionsPerWeek,
                    hours_per_session: hoursPerSession || 1,
                    plan_total: plan.total,
                })
                .select(selectBooking)
                .single());
            if (insertError && (insertError as { code?: string }).code === '42703') {
                ({ data: booking, error: insertError } = await supabaseAdmin
                    .from('sessions')
                    .insert({ ...baseInsert, amount: plan.total })
                    .select(selectBooking)
                    .single());
            }
        } else {
            ({ data: booking, error: insertError } = await supabaseAdmin
                .from('sessions')
                .insert({ ...baseInsert, amount: plan.perSession })
                .select(selectBooking)
                .single());
        }

        if (insertError || !booking) {
            console.error('Error creating booking:', insertError);
            return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
        }

        return NextResponse.json({ booking, bookedFor: bookedForChildName }, { status: 201 });
    } catch (error) {
        console.error('Error in bookings POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
