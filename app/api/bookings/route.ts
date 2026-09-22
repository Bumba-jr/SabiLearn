import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

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

        // Find or create the student record for this user
        let { data: studentRow } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!studentRow) {
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
            studentRow = created;
        }

        // Price the booking from the tutor's hourly rate
        const duration = Number(durationMinutes) || 60;
        const amount = tutor.hourly_rate && tutor.hourly_rate > 0
            ? Math.round((tutor.hourly_rate * duration) / 60)
            : null;

        const { data: booking, error: insertError } = await supabaseAdmin
            .from('sessions')
            .insert({
                tutor_id: tutor.id,
                student_id: studentRow.id,
                subject,
                scheduled_at: new Date(scheduledAt).toISOString(),
                duration_minutes: duration,
                status: 'pending',
                location_type: mode === 'home' ? 'home' : 'online',
                location_address: address || null,
                amount,
                payment_status: 'unpaid',
                notes: notes || null,
            })
            .select(`
                *,
                tutor:tutors(id, name, avatar_url, location, hourly_rate),
                student:students(id, name, email)
            `)
            .single();

        if (insertError) {
            console.error('Error creating booking:', insertError);
            return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
        }

        return NextResponse.json({ booking }, { status: 201 });
    } catch (error) {
        console.error('Error in bookings POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
