'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Star, Loader2, X, Check, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
    id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    location_type: string;
    location_address: string | null;
    amount: number | null;
    payment_status: string;
    notes: string | null;
    tutor: { id: string; name: string; avatar_url: string | null; location: string | null } | null;
    student: { id: string; name: string; email: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    declined: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('en-NG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export function BookingsList({ view }: { view: 'student' | 'tutor' }) {
    const { session } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actingOn, setActingOn] = useState<string | null>(null);

    // Review modal state
    const [reviewing, setReviewing] = useState<Booking | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [payingBooking, setPayingBooking] = useState<string | null>(null);

    const handlePay = async (bookingId: string) => {
        if (!session?.access_token) return;
        try {
            setPayingBooking(bookingId);
            const response = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ bookingId }),
            });
            const data = await response.json();
            if (!response.ok) {
                toast.error(data.error || 'Could not start payment');
                return;
            }
            window.location.href = data.authorizationUrl;
        } catch {
            toast.error('Could not reach the payment service');
            setPayingBooking(null);
        }
    };

    const fetchBookings = useCallback(async () => {
        if (!session?.access_token) return;
        try {
            setLoading(true);
            setError(null);
            const url = view === 'tutor' ? '/api/bookings?view=tutor' : '/api/bookings';
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Failed to load bookings');
                return;
            }
            setBookings(data.bookings || []);
        } catch {
            setError('Could not reach the booking service');
        } finally {
            setLoading(false);
        }
    }, [session?.access_token, view]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const act = async (bookingId: string, action: 'accept' | 'decline' | 'cancel' | 'complete') => {
        if (!session?.access_token) return;
        try {
            setActingOn(bookingId + action);
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action }),
            });
            const data = await response.json();
            if (!response.ok) {
                toast.error(data.error || 'Action failed');
                return;
            }
            setBookings((prev) => prev.map((b) => (b.id === bookingId ? data.booking : b)));
            toast.success(
                action === 'accept' ? 'Booking accepted' :
                action === 'decline' ? 'Booking declined' :
                action === 'cancel' ? 'Booking cancelled' :
                'Lesson marked as completed'
            );
        } catch {
            toast.error('Could not reach the booking service');
        } finally {
            setActingOn(null);
        }
    };

    const submitReview = async () => {
        if (!session?.access_token || !reviewing) return;
        try {
            setSubmittingReview(true);
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    sessionId: reviewing.id,
                    rating: reviewRating,
                    comment: reviewComment,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                toast.error(data.error || 'Failed to submit review');
                return;
            }
            toast.success('Thanks for your review!');
            setReviewing(null);
            setReviewComment('');
            setReviewRating(5);
        } catch {
            toast.error('Could not reach the review service');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (!session) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center text-gray-500">
                Sign in to see your bookings.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
                <p className="text-gray-600 mb-3">{error}</p>
                <button onClick={fetchBookings} className="text-green-600 font-semibold text-sm hover:underline">
                    Try Again
                </button>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                <p className="text-gray-600 font-medium mb-1">No bookings yet</p>
                <p className="text-sm text-gray-500">
                    {view === 'tutor'
                        ? 'When a parent books you, the request will appear here.'
                        : 'Book a tutor and your lessons will show up here.'}
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {bookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                    </span>
                                    {b.amount ? (
                                        <span className="text-sm font-bold text-gray-900">₦{b.amount.toLocaleString()}</span>
                                    ) : null}
                                    <span className="text-xs text-gray-400">
                                        {b.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                                    </span>
                                </div>
                                <p className="font-semibold text-gray-900">
                                    {view === 'tutor' ? b.student?.name || 'Student' : b.tutor?.name || 'Tutor'}
                                    <span className="font-normal text-gray-500"> · {b.subject}</span>
                                </p>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {formatDateTime(b.scheduled_at)} · {b.duration_minutes} min ·{' '}
                                    {b.location_type === 'home' ? `Home${b.location_address ? ` (${b.location_address})` : ''}` : 'Online'}
                                </p>
                                {b.notes && (
                                    <p className="text-sm text-gray-500 mt-1 italic">“{b.notes}”</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                {view === 'tutor' && b.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => act(b.id, 'accept')}
                                            disabled={actingOn === b.id + 'accept'}
                                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                                        >
                                            <Check className="w-4 h-4" /> Accept
                                        </button>
                                        <button
                                            onClick={() => act(b.id, 'decline')}
                                            disabled={actingOn === b.id + 'decline'}
                                            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                                        >
                                            <X className="w-4 h-4" /> Decline
                                        </button>
                                    </>
                                )}
                                {view === 'tutor' && b.status === 'accepted' && (
                                    <button
                                        onClick={() => act(b.id, 'complete')}
                                        disabled={actingOn === b.id + 'complete'}
                                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Mark Completed
                                    </button>
                                )}
                                {view === 'student' && ['pending', 'accepted'].includes(b.status) && (
                                    <button
                                        onClick={() => act(b.id, 'cancel')}
                                        disabled={actingOn === b.id + 'cancel'}
                                        className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                                    >
                                        <XCircle className="w-4 h-4" /> Cancel
                                    </button>
                                )}
                                {view === 'student' && b.status === 'accepted' && b.payment_status !== 'paid' && b.amount && (
                                    <button
                                        onClick={() => handlePay(b.id)}
                                        disabled={payingBooking === b.id}
                                        className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                                    >
                                        {payingBooking === b.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <span>₦{b.amount.toLocaleString()} · Pay Now</span>
                                        )}
                                    </button>
                                )}
                                {view === 'student' && b.status === 'completed' && (
                                    <button
                                        onClick={() => setReviewing(b)}
                                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                    >
                                        <Star className="w-4 h-4" /> Leave Review
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Review Modal */}
            {reviewing && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Review {reviewing.tutor?.name || 'your tutor'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">{reviewing.subject} lesson</p>

                        <div className="flex gap-1.5 mb-4">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} onClick={() => setReviewRating(n)} className="p-0.5">
                                    <Star
                                        className={`w-8 h-8 ${n <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                    />
                                </button>
                            ))}
                        </div>

                        <textarea
                            rows={4}
                            placeholder="How was the lesson? (optional)"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 resize-none mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setReviewing(null)}
                                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 rounded-xl text-sm font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReview}
                                disabled={submittingReview}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
