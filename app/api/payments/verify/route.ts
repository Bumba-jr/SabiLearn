import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// GET /api/payments/verify?reference=... — verify a Paystack transaction and
// mark the booking paid. Called by the payment callback page.
export async function GET(req: Request) {
    try {
        if (!PAYSTACK_SECRET_KEY) {
            return NextResponse.json({ error: 'Payments are not configured yet' }, { status: 501 });
        }

        const { searchParams } = new URL(req.url);
        const reference = searchParams.get('reference');
        if (!reference) {
            return NextResponse.json({ error: 'reference is required' }, { status: 400 });
        }

        const verifyResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );
        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyData?.status) {
            console.error('Paystack verify failed:', verifyData);
            return NextResponse.json(
                { error: verifyData?.message || 'Failed to verify payment' },
                { status: 502 }
            );
        }

        const { status, amount, metadata } = verifyData.data;
        const bookingId: string | undefined = metadata?.bookingId;

        if (status === 'success' && bookingId) {
            // Idempotency: only flip unpaid -> paid
            const { data: booking } = await supabaseAdmin
                .from('sessions')
                .select('id, payment_status, amount')
                .eq('id', bookingId)
                .single();

            if (booking && booking.payment_status !== 'paid') {
                // Amount check: Paystack reports kobo
                if (booking.amount && amount < booking.amount * 100) {
                    return NextResponse.json(
                        { status: 'failed', reason: 'Amount paid does not match the booking price' },
                        { status: 400 }
                    );
                }
                await supabaseAdmin
                    .from('sessions')
                    .update({ payment_status: 'paid' })
                    .eq('id', bookingId);
            }

            return NextResponse.json({ status: 'paid', bookingId });
        }

        return NextResponse.json({ status: status || 'failed' }, { status: 400 });
    } catch (error) {
        console.error('Error in payments verify:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/payments/verify — Paystack webhook receiver.
// Configure in the Paystack dashboard: https://<your-domain>/api/payments/verify
export async function POST(req: Request) {
    try {
        if (!PAYSTACK_SECRET_KEY) {
            return NextResponse.json({ error: 'Payments are not configured yet' }, { status: 501 });
        }

        const rawBody = await req.text();
        const signature = req.headers.get('x-paystack-signature');

        const expected = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(rawBody)
            .digest('hex');

        if (!signature || signature !== expected) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(rawBody);
        if (event?.event === 'charge.success') {
            const bookingId: string | undefined = event.data?.metadata?.bookingId;
            if (bookingId) {
                await supabaseAdmin
                    .from('sessions')
                    .update({ payment_status: 'paid' })
                    .eq('id', bookingId)
                    .eq('payment_status', 'unpaid');
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error in payments webhook:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
