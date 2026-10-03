'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, Building2, Smartphone, Lock, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Booking {
    id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    amount: number | null;
    payment_status: string;
    plan_period?: string | null;
    sessions_per_week?: number | null;
    hours_per_session?: number | null;
    plan_total?: number | null;
    tutor?: { id: string; name: string; avatar_url?: string | null; hourly_rate?: number | null } | null;
    student?: { id: string; name: string } | null;
}

type PaymentMethod = 'card' | 'bank' | 'ussd';

const METHOD_CHANNELS: Record<PaymentMethod, string[]> = {
    card: ['card'],
    bank: ['bank_transfer'],
    ussd: ['ussd'],
};

export default function CheckoutPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('card');
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setError('Please sign in to view this checkout.');
            setLoading(false);
            return;
        }
        let active = true;

        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) throw new Error('No active session');
                const res = await fetch(`/api/bookings/${bookingId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                const data = await res.json();
                if (!active) return;
                if (!res.ok) throw new Error(data.error || 'Booking not found');
                setBooking(data.booking);
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : 'Could not load the booking.');
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => { active = false; };
    }, [bookingId, user, authLoading]);

    const naira = (n: number) => `₦${n.toLocaleString()}`;

    const handlePay = async () => {
        if (!booking || paying) return;
        setPaying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ bookingId: booking.id, channels: METHOD_CHANNELS[selectedPayment] }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not start the payment.');
                return;
            }
            window.location.href = data.authorizationUrl;
        } catch {
            toast.error('Could not reach the payment service.');
        } finally {
            setPaying(false);
        }
    };

    const rate = booking?.amount && booking?.duration_minutes
        ? Math.round(booking.amount / (booking.duration_minutes / 60))
        : booking?.tutor?.hourly_rate ?? null;

    // Mockup-style date/time formatting
    const dateLabel = booking?.scheduled_at
        ? new Date(booking.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
    const timeLabel = booking?.scheduled_at
        ? new Date(booking.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : '—';
    const durationLabel = booking?.duration_minutes
        ? booking.duration_minutes >= 60
            ? `${booking.duration_minutes / 60} hour${booking.duration_minutes > 60 ? 's' : ''}`
            : `${booking.duration_minutes} minutes`
        : '—';

    const methodButton = (method: PaymentMethod, label: string, Icon: typeof CreditCard) => (
        <button
            onClick={() => setSelectedPayment(method)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedPayment === method
                ? 'border-secondary bg-secondary/5'
                : 'border-gray-200 hover:border-gray-300'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === method ? 'border-secondary' : 'border-gray-300'}`}>
                    {selectedPayment === method && (
                        <div className="w-3 h-3 rounded-full bg-secondary" />
                    )}
                </div>
                <span className="font-medium text-gray-900">{label}</span>
            </div>
            <Icon className="w-5 h-5 text-gray-400" />
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 md:py-16 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
                        Complete Booking
                    </h1>
                    <p className="text-base text-gray-600">
                        {booking?.tutor?.name
                            ? `Secure checkout for your session with ${booking.tutor.name}.`
                            : 'Secure checkout for your session.'}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error || !booking ? (
                    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center">
                        <p className="text-gray-600 mb-4">{error || 'Booking not found.'}</p>
                        <button
                            onClick={() => router.push('/dashboard/student')}
                            className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : booking.payment_status === 'paid' ? (
                    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                            This session is already paid
                        </h2>
                        <p className="text-gray-600 mb-6">You&apos;re all set — see you in class!</p>
                        <button
                            onClick={() => router.push('/dashboard/student')}
                            className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-[60%_40%] max-w-4xl mx-auto border border-slate-300/20 rounded-2xl bg-white overflow-hidden shadow-sm">
                        {/* Left - Payment Method */}
                        <div className="p-6 md:p-8 lg:border-r border-slate-400/20">
                            <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Select Payment Method
                            </h2>

                            <div className="space-y-3 mb-6">
                                {methodButton('card', 'Card Payment (Paystack)', CreditCard)}
                                {methodButton('bank', 'Bank Transfer', Building2)}
                                {methodButton('ussd', 'USSD', Smartphone)}
                            </div>

                            {/* Card Details Form */}
                            {selectedPayment === 'card' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cardholder Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Mr. Adebayo"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Card Number
                                        </label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                            You&apos;ll confirm these details on Paystack&apos;s secure page — card details never touch SabiLearn servers.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {selectedPayment === 'bank' && (
                                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                                    You&apos;ll get a one-time account number on Paystack&apos;s secure page to transfer from your banking app.
                                </p>
                            )}
                            {selectedPayment === 'ussd' && (
                                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                                    Pick your bank on Paystack&apos;s secure page and approve the USSD code from your phone.
                                </p>
                            )}
                        </div>

                        {/* Right - Session Summary */}
                        <div className="p-6 md:p-8 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>
                                Session Summary
                            </h2>

                            {/* Tutor Info */}
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                                {booking.tutor?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={booking.tutor.avatar_url} alt={booking.tutor.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
                                        {(booking.tutor?.name || 'T').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        {booking.tutor?.name || 'Tutor'}
                                    </p>
                                    <p className="text-sm text-gray-500">{booking.subject || 'Tutoring session'}</p>
                                </div>
                            </div>

                            {/* Session Details */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Date</span>
                                    <span className="font-medium text-gray-900">{dateLabel}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Time</span>
                                    <span className="font-medium text-gray-900">{timeLabel}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Duration</span>
                                    <span className="font-medium text-gray-900">{durationLabel}</span>
                                </div>
                                {rate ? (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Rate</span>
                                        <span className="font-medium text-gray-900">{naira(rate)}/hr</span>
                                    </div>
                                ) : null}
                                {booking.plan_period && booking.plan_period !== 'single' && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Lessons per week</span>
                                            <span className="font-medium text-gray-900">{booking.sessions_per_week || 1}×</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Hours per lesson</span>
                                            <span className="font-medium text-gray-900">{booking.hours_per_session || 1} hr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Plan</span>
                                            <span className="font-medium capitalize text-gray-900">{booking.plan_period}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mb-6">
                                <span className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    Total Due
                                </span>
                                <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    {naira(booking.plan_total || booking.amount || 0)}
                                </span>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handlePay}
                                disabled={paying || !booking.amount}
                                className="w-full bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {paying ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Lock className="w-5 h-5" />
                                )}
                                <span>Pay {naira(booking.plan_total || booking.amount || 0)}</span>
                            </button>
                            <p className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                                <Lock className="w-3.5 h-3.5" />
                                Payments secured by fintech infrastructure
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
