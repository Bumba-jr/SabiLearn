import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    // action -> statuses a session may be in for the action to apply
    accept: ['pending'],
    decline: ['pending'],
    cancel: ['pending', 'accepted'],
    complete: ['accepted'],
};

// PATCH /api/bookings/[id] — tutor accepts/declines/completes, student cancels
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;

        const body = await req.json();
        const action = body?.action;
        if (!action || !ALLOWED_TRANSITIONS[action]) {
            return NextResponse.json(
                { error: 'Invalid action. Use accept, decline, cancel, or complete.' },
                { status: 400 }
            );
        }

        // Fetch the booking with tutor/student linkage
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('sessions')
            .select(`
                id, status, tutor_id, student_id,
                tutor:tutors(id, auth_user_id, user_id),
                student:students(id, user_id)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const tutorAuthId = (booking.tutor as any)?.auth_user_id || (booking.tutor as any)?.user_id;
        const studentUserId = (booking.student as any)?.user_id;

        const isTutor = tutorAuthId === user.id;
        const isStudent = studentUserId === user.id;

        if (['accept', 'decline', 'complete'].includes(action) && !isTutor) {
            return NextResponse.json({ error: 'Only the tutor can do this' }, { status: 403 });
        }
        if (action === 'cancel' && !isStudent) {
            return NextResponse.json({ error: 'Only the student who booked can cancel' }, { status: 403 });
        }

        if (!ALLOWED_TRANSITIONS[action].includes(booking.status)) {
            return NextResponse.json(
                { error: `Cannot ${action} a booking that is ${booking.status}` },
                { status: 400 }
            );
        }

        const newStatus = action === 'accept' ? 'accepted'
            : action === 'decline' ? 'declined'
            : action === 'cancel' ? 'cancelled'
            : 'completed';

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('sessions')
            .update({ status: newStatus })
            .eq('id', id)
            .select(`
                *,
                tutor:tutors(id, name, avatar_url, location, hourly_rate),
                student:students(id, name, email)
            `)
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
        }

        return NextResponse.json({ booking: updated });
    } catch (error) {
        console.error('Error in booking PATCH:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
