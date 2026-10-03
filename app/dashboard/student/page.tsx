'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutButton } from '@/components/SignOutButton';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';
import {
    Calendar, Wallet, CheckCircle2, Clock, X, Loader2, MapPin, Video,
    ChevronRight, Heart, Star, MessageCircle, Megaphone,
} from 'lucide-react';
import { ChatPopup } from '@/components/ChatPopup';

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
    tutor?: { id: string; name: string } | null;
}

interface FavoriteTutor {
    id: string;
    name: string;
    avatar_url: string | null;
    rating: number;
    hourly_rate: number | null;
    subjects: string[];
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const fmtDate = (ts: string) => new Date(ts).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [favorites, setFavorites] = useState<FavoriteTutor[]>([]);
    const [tab, setTab] = useState<'overview' | 'bookings' | 'favorites' | 'messages'>('overview');
    const [paying, setPaying] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [myCode, setMyCode] = useState<string | null>(null);
    const [parentLinked, setParentLinked] = useState(true);
    const [familyCodeInput, setFamilyCodeInput] = useState('');
    const [linkingCode, setLinkingCode] = useState(false);
    const [liveClasses, setLiveClasses] = useState<any[]>([]);
    const [adminRequests, setAdminRequests] = useState<any[]>([]);
    const [showAdminChat, setShowAdminChat] = useState(false);
    const [activeChat, setActiveChat] = useState<{ id: string; name: string; avatar: string | null } | null>(null);

    const loadDashboard = useCallback(async () => {
        try {
            const res = await fetch('/api/dashboard');
            if (res.status === 401) {
                router.push('/sign-in');
                return;
            }
            const data = await res.json();
            setStudent(data.student);
            setBookings(data.myBookings || []);
            setAdminRequests(data.adminRequests || []);
            if (data.student?.childCode) setMyCode(data.student.childCode);
            if (data.student) setParentLinked(data.student.parentLinked !== false);
            const msgRes = await fetch('/api/messages');
            if (msgRes.ok) {
                const msgData = await msgRes.json();
                setConversations(msgData.conversations || []);
            }
        } catch {
            toast.error('Could not load your dashboard. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (user) loadDashboard();
        else setLoading(false);
    }, [user, loadDashboard]);

    // Favorites live in their own API; enrich with tutor details
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await fetch('/api/favorites');
                if (!res.ok) return;
                const { tutorIds } = await res.json();
                if (!tutorIds?.length) return;
                // Fetch each favorite tutor's public data from the list API result cache
                const listRes = await fetch('/api/tutors?');
                const list = listRes.ok ? (await listRes.json()).tutors || [] : [];
                const favs = tutorIds
                    .map((id: string) => list.find((t: any) => t.id === id))
                    .filter(Boolean)
                    .map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        avatar_url: t.image,
                        rating: t.rating,
                        hourly_rate: t.hourlyRate,
                        subjects: t.subjects || [],
                    }));
                setFavorites(favs);
            } catch {
                // favorites are non-critical
            }
        })();
    }, [user]);

    const claimFamilyCode = async () => {
        const code = familyCodeInput.trim().toUpperCase();
        if (!code || linkingCode) return;
        setLinkingCode(true);
        try {
            const res = await fetch('/api/student/claim-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not link the code.');
                return;
            }
            toast.success(`Linked! You now appear in your family's dashboard as ${data.childName}.`);
            setParentLinked(true);
            await loadDashboard();
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setLinkingCode(false);
        }
    };

    // Real-time: poll for live classes every 30s
    useEffect(() => {
        if (!user) return;
        let active = true;
        const poll = async () => {
            try {
                const res = await fetch('/api/classes', { cache: 'no-store' });
                if (res.ok && active) {
                    const data = await res.json();
                    setLiveClasses(data.liveClasses || []);
                }
            } catch { /* transient */ }
        };
        poll();
        const t = setInterval(poll, 30000);
        return () => { active = false; clearInterval(t); };
    }, [user]);

    const now = new Date();
    const upcoming = bookings
        .filter((b) => b.status === 'accepted' && new Date(b.scheduled_at) >= now)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    const requests = bookings.filter((b) => b.status === 'pending');
    const history = bookings.filter((b) => ['completed', 'declined', 'cancelled'].includes(b.status)
        || (b.status === 'accepted' && new Date(b.scheduled_at) < now));
    const unpaidAccepted = upcoming.filter((b) => b.payment_status !== 'paid');

    const payNow = (b: Booking) => {
        // Checkout page handles payment-method selection + Paystack start
        router.push(`/checkout/${b.id}`);
    };

    const cancelBooking = async (b: Booking) => {
        setCancelling(b.id);
        try {
            const res = await fetch(`/api/bookings/${b.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error || 'Could not cancel the booking.');
                return;
            }
            toast.success('Booking cancelled.');
            await loadDashboard();
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setCancelling(null);
        }
    };

    if (!user && !loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-lg text-gray-600 mb-4">Sign in to view your dashboard.</p>
                        <button onClick={() => router.push('/sign-in')} className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold">Sign In</button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                </div>
            </div>
        );
    }

    const BookingCard = ({ b }: { b: Booking }) => {
        const canPay = b.status === 'accepted' && b.payment_status !== 'paid';
        const canCancel = ['pending', 'accepted'].includes(b.status);
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                b.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                b.status === 'accepted' ? 'bg-green-50 text-green-600' :
                                b.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                                'bg-gray-100 text-gray-500'
                            }`}>{b.status}</span>
                            {b.payment_status === 'paid'
                                ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">paid</span>
                                : canPay && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500">payment needed</span>}
                        </div>
                        <p className="font-bold text-gray-900">{b.subject}</p>
                        <p className="text-sm text-gray-500">
                            With {b.tutor?.name || 'tutor'} • {fmtDate(b.scheduled_at)} at {fmtTime(b.scheduled_at)} ({b.duration_minutes} min)
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            {b.location_type === 'home'
                                ? <><MapPin className="w-3.5 h-3.5" /> {b.location_address || 'Home lesson'}</>
                                : <><Video className="w-3.5 h-3.5" /> Online</>}
                        </p>
                    </div>
                    <p className="font-bold text-gray-900">{b.amount != null ? naira(Number(b.amount)) : '—'}</p>
                </div>
                {(canPay || canCancel) && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                        {canPay && (
                            <button
                                onClick={() => payNow(b)}
                                disabled={paying === b.id}
                                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                {paying === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                                Pay now
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => cancelBooking(b)}
                                disabled={cancelling === b.id}
                                className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 border border-gray-300 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back{student?.name ? `, ${student.name.split(' ')[0]}` : ''} 👋
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Track your lessons, payments and favorite tutors.</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {myCode && (
                                <button
                                    onClick={() => { navigator.clipboard.writeText(myCode); toast.success(`Code ${myCode} copied.`); }}
                                    title="Click to copy"
                                    className="text-xs font-mono font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-md hover:bg-green-100 transition-colors"
                                >
                                    My code: {myCode} ⧉
                                </button>
                            )}
                            {parentLinked && (
                                <span className="text-xs text-gray-400">Linked to a family account ✓</span>
                            )}
                        </div>
                    </div>
                    <SignOutButton />
                </div>

                {/* Family linking for self-signed-up students */}
                {!parentLinked && (
                    <div className="bg-white rounded-2xl border border-orange-200 p-4 mb-6 flex flex-wrap items-center gap-3">
                        <p className="text-sm text-orange-700 flex-1 min-w-[220px]">
                            Have a family code from your parent? Enter it to appear in their dashboard with your lessons.
                        </p>
                        <input
                            value={familyCodeInput}
                            onChange={(e) => setFamilyCodeInput(e.target.value.toUpperCase())}
                            placeholder="SB-XXXXXX"
                            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-mono outline-none focus:border-green-600 w-[150px]"
                        />
                        <button
                            onClick={claimFamilyCode}
                            disabled={!familyCodeInput.trim() || linkingCode}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                        >
                            {linkingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link'}
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Upcoming Sessions', value: upcoming.length, icon: Calendar, color: 'text-blue-500 bg-blue-50' },
                        { label: 'Awaiting Confirmation', value: requests.length, icon: Clock, color: 'text-orange-500 bg-orange-50' },
                        { label: 'Completed', value: history.filter((b) => b.status === 'completed').length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
                        { label: 'Favorite Tutors', value: favorites.length, icon: Heart, color: 'text-pink-500 bg-pink-50' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Admin requests */}
                {adminRequests.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Megaphone className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-orange-800 mb-1">
                                    The SabiLearn team {adminRequests.length > 1 ? 'has requests' : 'has a request'} for you:
                                </p>
                                {adminRequests.map((r) => (
                                    <p key={r.id} className="text-sm text-orange-700">
                                        {r.type === 'document_request' ? '📄 Document needed: ' : '❓ Info needed: '}{r.message}
                                    </p>
                                ))}
                                <button
                                    onClick={() => setShowAdminChat(true)}
                                    className="mt-2 text-sm font-semibold text-orange-800 hover:underline"
                                >
                                    Reply to the team →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Live class banner */}
                {liveClasses.length > 0 && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6">
                        {liveClasses.map((c) => (
                            <div key={c.id} className="flex flex-wrap items-center gap-3">
                                <span className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-white" /> LIVE NOW
                                </span>
                                <p className="text-sm text-red-800 flex-1">
                                    Your <span className="font-bold">{c.session?.subject}</span> class with {c.session?.tutor?.name} is happening right now!
                                </p>
                                <button
                                    onClick={() => router.push(`/class/${c.id}`)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                >
                                    Join Class
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payment nudge */}
                {unpaidAccepted.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 text-sm text-orange-700">
                        You have {unpaidAccepted.length} confirmed session{unpaidAccepted.length > 1 ? 's' : ''} awaiting payment — the tutor's time is only locked in after payment.
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {([
                        ['overview', 'Overview'],
                        ['bookings', `My Bookings${bookings.length ? ` (${bookings.length})` : ''}`],
                        ['favorites', `Favorites${favorites.length ? ` (${favorites.length})` : ''}`],
                        ['messages', `Messages${conversations.some((c) => c.unread > 0) ? ' •' : ''}`],
                    ] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                                tab === key ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                Next lessons <ChevronRight className="w-4 h-4 text-gray-400" />
                            </h2>
                            {upcoming.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                                    <p className="text-sm text-gray-400 mb-4">No upcoming lessons yet.</p>
                                    <button onClick={() => router.push('/find-tutors')} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                                        Find a Tutor
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">{upcoming.slice(0, 3).map((b) => <BookingCard key={b.id} b={b} />)}</div>
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                Your favorites <ChevronRight className="w-4 h-4 text-gray-400" />
                            </h2>
                            {favorites.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
                                    Save tutors while browsing to see them here.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {favorites.slice(0, 4).map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => router.push(`/tutor/${t.id}`)}
                                            className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 text-left hover:border-green-300 transition-colors"
                                        >
                                            {t.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={t.avatar_url} alt={t.name} className="w-11 h-11 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center font-bold">
                                                    {t.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{t.subjects.slice(0, 3).join(', ') || 'Tutor'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-yellow-600 font-semibold flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {Number(t.rating || 0).toFixed(1)}</p>
                                                {t.hourly_rate ? <p className="text-xs text-gray-500">{naira(Number(t.hourly_rate))}/hr</p> : null}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'bookings' && (
                    <div className="space-y-6">
                        {[
                            ['Upcoming', upcoming],
                            ['Awaiting confirmation', requests],
                            ['History', history],
                        ].map(([label, list]) => (
                            <div key={label as string}>
                                <h2 className="font-bold text-gray-900 mb-3">{label as string}</h2>
                                {(list as Booking[]).length === 0
                                    ? <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">Nothing here yet.</div>
                                    : <div className="space-y-4">{(list as Booking[]).map((b) => <BookingCard key={b.id} b={b} />)}</div>}
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'favorites' && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favorites.length === 0 ? (
                            <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                                No saved tutors yet — tap the heart on any tutor card to save them.
                            </div>
                        ) : favorites.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => router.push(`/tutor/${t.id}`)}
                                className="bg-white rounded-2xl border border-gray-200 p-5 text-left hover:border-green-300 transition-colors"
                            >
                                {t.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={t.avatar_url} alt={t.name} className="w-14 h-14 rounded-2xl object-cover mb-3" />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center text-xl font-bold mb-3">
                                        {t.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <p className="font-bold text-gray-900">{t.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{t.subjects.slice(0, 3).join(', ') || 'Tutor'}</p>
                                <p className="text-xs text-gray-600">
                                    <Star className="w-3 h-3 inline fill-yellow-400 text-yellow-400" /> {Number(t.rating || 0).toFixed(1)}
                                    {t.hourly_rate ? ` • ${naira(Number(t.hourly_rate))}/hr` : ''}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
                {tab === 'messages' && (
                    <div className="space-y-3">
                        {conversations.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400 text-sm">
                                No conversations yet — tap "Send Message" on any tutor's profile to start one.
                            </div>
                        ) : conversations.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveChat({ id: c.id, name: c.otherName, avatar: c.otherAvatar })}
                                className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 text-left hover:border-green-300 transition-colors"
                            >
                                {c.otherAvatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={c.otherAvatar} alt={c.otherName} className="w-11 h-11 rounded-full object-cover" />
                                ) : (
                                    <div className="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                                        {c.otherName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{c.otherName}</p>
                                    <p className="text-xs text-gray-500 truncate">{c.lastMessage || 'No messages yet'}</p>
                                </div>
                                <div className="text-right">
                                    {c.unread > 0 && (
                                        <span className="bg-green-600 text-white text-xs font-bold rounded-full px-2 py-0.5">{c.unread}</span>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
            {activeChat && (
                <ChatPopup
                    isOpen
                    onClose={() => {
                        setActiveChat(null);
                        loadDashboard();
                    }}
                    conversationId={activeChat.id}
                    tutorName={activeChat.name}
                    tutorAvatar={activeChat.avatar}
                />
            )}
            {showAdminChat && (
                <ChatPopup
                    isOpen
                    onClose={() => setShowAdminChat(false)}
                    withAdmin
                    tutorName="SabiLearn Team"
                />
            )}
        </div>
    );
}
