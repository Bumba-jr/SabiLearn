import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function getAuthUser(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// POST /api/payments/initialize — start a Paystack transaction for a booking.
// Body: { bookingId }. The booking must belong to the caller and be accepted.
export async function POST(req: Request) {
    try {
        if (!PAYSTACK_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Payments are not configured yet. Set PAYSTACK_SECRET_KEY in the environment.' },
                { status: 501 }
            );
        }

        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { bookingId } = body;
        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
        }

        // The booking must belong to this user and be in a payable state
        const { data: studentRow } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!studentRow) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('sessions')
            .select('id, student_id, amount, status, payment_status, tutor:tutors(name)')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        if (booking.student_id !== studentRow.id) {
            return NextResponse.json({ error: 'You can only pay for your own bookings' }, { status: 403 });
        }
        if (booking.payment_status === 'paid') {
            return NextResponse.json({ error: 'This booking is already paid' }, { status: 400 });
        }
        if (!booking.amount || booking.amount <= 0) {
            return NextResponse.json(
                { error: 'This booking has no price set yet. Contact support.' },
                { status: 400 }
            );
        }

        const origin = new URL(req.url).origin;
        const tutorName = (booking.tutor as any)?.name || 'your tutor';

        // Initialize the transaction with Paystack
        const initResponse = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: user.email,
                // Paystack expects kobo
                amount: Math.round(booking.amount * 100),
                reference: `sabilearn_${booking.id}_${Date.now()}`,
                callback_url: `${origin}/payment/callback`,
                metadata: {
                    bookingId: booking.id,
                    purpose: 'sabilearn_lesson',
                    tutorName,
                },
            }),
        });

        const initData = await initResponse.json();
        if (!initResponse.ok || !initData?.status) {
            console.error('Paystack initialize failed:', initData);
            return NextResponse.json(
                { error: initData?.message || 'Failed to start payment' },
                { status: 502 }
            );
        }

        return NextResponse.json({
            authorizationUrl: initData.data.authorization_url,
            reference: initData.data.reference,
        });
    } catch (error) {
        console.error('Error in payments initialize:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
