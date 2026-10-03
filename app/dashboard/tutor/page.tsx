'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutButton } from '@/components/SignOutButton';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';
import {
    Star, Calendar, Wallet, CheckCircle2, Clock, X, Check, Loader2,
    MapPin, Video, ChevronRight, Plus, Trash2, MessageCircle, Radio, Zap,
    DollarSign, Users, Pencil,
} from 'lucide-react';
import { ChatPopup } from '@/components/ChatPopup';
import { Megaphone } from 'lucide-react';

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
    student?: { id: string; name: string; email: string } | null;
    tutor?: { id: string; name: string } | null;
}

interface DayRange { from: string; to: string }
type Availability = Record<string, DayRange[]>;

const DAYS = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
];

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const fmtDate = (ts: string) => new Date(ts).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

export default function TutorDashboardPage() {
    const { user, session } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tutor, setTutor] = useState<any>(null);
    const [incoming, setIncoming] = useState<Booking[]>([]);
    const [upcoming, setUpcoming] = useState<Booking[]>([]);
    const [past, setPast] = useState<Booking[]>([]);
    const [stats, setStats] = useState({ pendingCount: 0, upcomingCount: 0, completedCount: 0, earningsTotal: 0, unreadMessages: 0 });
    const [tab, setTab] = useState<'overview' | 'requests' | 'sessions' | 'availability' | 'messages'>('overview');
    const [actingOn, setActingOn] = useState<string | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<{ id: string; name: string; avatar: string | null } | null>(null);

    // Availability editor state
    const [availability, setAvailability] = useState<Availability>({});
    const [availabilityDirty, setAvailabilityDirty] = useState(false);
    const [savingAvailability, setSavingAvailability] = useState(false);
    const [startingClass, setStartingClass] = useState<string | null>(null);
    const [instantOpen, setInstantOpen] = useState(false);
    const [instantStudents, setInstantStudents] = useState<any[]>([]);
    const [instantLoading, setInstantLoading] = useState(false);
    const [adminRequests, setAdminRequests] = useState<any[]>([]);
    const [showAdminChat, setShowAdminChat] = useState(false);
    const [rateEditing, setRateEditing] = useState(false);
    const [rateInput, setRateInput] = useState('');
    const [savingRate, setSavingRate] = useState(false);

    const saveRate = async () => {
        const rate = Number(rateInput);
        if (!Number.isFinite(rate) || rate < 0) {
            toast.error('Enter a valid hourly rate.');
            return;
        }
        setSavingRate(true);
        try {
            const res = await fetch('/api/tutor/rate', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ hourlyRate: rate }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not save your rate.');
                return;
            }
            toast.success('Your hourly price is updated — parents now see it on your profile.');
            setRateEditing(false);
            loadDashboard();
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setSavingRate(false);
        }
    };

    const loadDashboard = useCallback(async () => {
        try {
            const res = await fetch('/api/dashboard');
            if (res.status === 401) {
                router.push('/sign-in');
                return;
            }
            const data = await res.json();
            setTutor(data.tutor);
            setIncoming(data.incoming || []);
            setUpcoming(data.upcoming || []);
            setPast(data.past || []);
            setStats(data.stats || { pendingCount: 0, upcomingCount: 0, completedCount: 0, earningsTotal: 0, unreadMessages: 0 });
            if (data.tutor?.availability) setAvailability(data.tutor.availability);
            setAdminRequests(data.adminRequests || []);
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

    const bookingAction = async (booking: Booking, action: 'accept' | 'decline') => {
        if (!session?.access_token) return;
        setActingOn(booking.id);
        try {
            const res = await fetch(`/api/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || `Could not ${action} the booking.`);
                return;
            }
            toast.success(action === 'accept' ? 'Booking accepted! The student will be notified to pay.' : 'Booking declined.');
            await loadDashboard();
        } catch {
            toast.error('Could not reach the server. Try again.');
        } finally {
            setActingOn(null);
        }
    };

    const startClass = async (booking: Booking) => {
        setStartingClass(booking.id);
        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not start the class.');
                return;
            }
            router.push(`/class/${data.classId}`);
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setStartingClass(null);
        }
    };

    const openInstantPicker = async () => {
        setInstantOpen(true);
        setInstantLoading(true);
        try {
            const res = await fetch('/api/tutor/students');
            const data = await res.json();
            setInstantStudents(data.students || []);
        } catch {
            toast.error('Could not load your students.');
        } finally {
            setInstantLoading(false);
        }
    };

    const startInstantClass = async (studentId: string) => {
        setStartingClass(studentId);
        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not start the class.');
                return;
            }
            router.push(`/class/${data.classId}`);
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setStartingClass(null);
        }
    };

    const saveAvailability = async () => {
        setSavingAvailability(true);
        try {
            const res = await fetch('/api/tutor/availability', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not save availability.');
                return;
            }
            toast.success('Availability saved! Parents can now see your free hours.');
            setAvailabilityDirty(false);
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setSavingAvailability(false);
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

    if (!tutor) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Finish your tutor profile</h2>
                        <p className="text-gray-500 text-sm mb-6">Your tutor dashboard unlocks once your application is complete.</p>
                        <button onClick={() => router.push('/onboarding/tutor')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                            Continue Onboarding
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Pending Requests', value: stats.pendingCount, icon: Clock, color: 'text-orange-500 bg-orange-50' },
        { label: 'Upcoming Sessions', value: stats.upcomingCount, icon: Calendar, color: 'text-blue-500 bg-blue-50' },
        { label: 'Completed', value: stats.completedCount, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
        { label: 'Earnings (paid)', value: naira(stats.earningsTotal), icon: Wallet, color: 'text-purple-500 bg-purple-50' },
        { label: 'Rating', value: `${Number(tutor.rating || 0).toFixed(1)} ★`, icon: Star, color: 'text-yellow-500 bg-yellow-50' },
    ];

    const BookingCard = ({ b, actions }: { b: Booking; actions?: 'request' }) => (
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
                        {b.payment_status === 'paid' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">paid</span>}
                    </div>
                    <p className="font-bold text-gray-900">{b.subject}</p>
                    <p className="text-sm text-gray-500">
                        {actions === 'request' ? `From ${b.student?.name || 'a student'}` : `With ${b.tutor?.name || 'tutor'}`}
                        {' • '}{fmtDate(b.scheduled_at)} at {fmtTime(b.scheduled_at)} ({b.duration_minutes} min)
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        {b.location_type === 'home'
                            ? <><MapPin className="w-3.5 h-3.5" /> {b.location_address || 'Home lesson'}</>
                            : <><Video className="w-3.5 h-3.5" /> Online</>}
                    </p>
                    {b.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2.5">"{b.notes}"</p>}
                </div>
                <p className="font-bold text-gray-900">{b.amount != null ? naira(Number(b.amount)) : '—'}</p>
            </div>
            {b.status === 'accepted' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => startClass(b)}
                        disabled={startingClass === b.id}
                        className="w-full bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        {startingClass === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                        Start Class
                    </button>
                    <p className="text-[11px] text-gray-400 mt-1.5 text-center">Opens your live lesson room — the student and parents see it instantly.</p>
                </div>
            )}
            {actions === 'request' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => bookingAction(b, 'accept')}
                        disabled={actingOn === b.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        {actingOn === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
                    </button>
                    <button
                        onClick={() => bookingAction(b, 'decline')}
                        disabled={actingOn === b.id}
                        className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 border border-gray-300 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <X className="w-4 h-4" /> Decline
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Profile header */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 flex flex-wrap items-center gap-4">
                    {tutor.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tutor.avatar_url} alt={tutor.name} className="w-16 h-16 rounded-2xl object-cover" />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center text-2xl font-bold">
                            {tutor.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900">{tutor.name}</h1>
                        <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                            <span className={tutor.is_verified ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
                                {tutor.is_verified ? '✓ Verified tutor' : '⏳ Verification in progress'}
                            </span>
                            {tutor.location && <span><MapPin className="w-3.5 h-3.5 inline" /> {tutor.location}</span>}
                            {rateEditing ? (
                                <span className="flex items-center gap-1.5">
                                    <span>₦</span>
                                    <input
                                        autoFocus
                                        type="number"
                                        min={0}
                                        step={100}
                                        value={rateInput}
                                        onChange={(e) => setRateInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveRate()}
                                        className="w-24 border border-gray-300 rounded-md px-2 py-0.5 text-sm text-gray-700 outline-none focus:border-primary"
                                        placeholder="5000"
                                    />
                                    <span>/hr</span>
                                    <button
                                        onClick={saveRate}
                                        disabled={savingRate}
                                        className="text-green-700 font-semibold hover:underline disabled:opacity-50"
                                    >
                                        {savingRate ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setRateEditing(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </span>
                            ) : (
                                <button
                                    onClick={() => { setRateInput(tutor.hourly_rate ? String(tutor.hourly_rate) : ''); setRateEditing(true); }}
                                    className={`flex items-center gap-1 hover:text-gray-700 transition-colors ${tutor.hourly_rate ? '' : 'text-primary font-medium'}`}
                                    title="Set or change your hourly price"
                                >
                                    {tutor.hourly_rate ? <span>{naira(Number(tutor.hourly_rate))}/hr</span> : <span>Set your price (₦/hr)</span>}
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <SignOutButton />
                        <button onClick={() => router.push(`/tutor/${tutor.id}`)} className="text-sm text-green-700 font-semibold hover:underline">
                            View public profile →
                        </button>
                    </div>
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

                {/* Stats strip — full width, above the dashboard panel */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    {statCards.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between gap-4 min-h-[120px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-outfit)' }}>{value}</p>
                                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dashboard panel — styled after the homepage design */}
                <div className="rounded-3xl border border-slate-300/40 shadow-xl bg-slate-100/50 p-4 md:p-5">
                    <div className="grid lg:grid-cols-[300px_1fr] gap-8">
                        {/* Sidebar */}
                        <aside className="rounded-2xl p-6 h-fit">
                            <div className="mb-6 bg-blue-600/5 p-4 rounded-2xl">
                                <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>Teacher Dashboard</h3>
                                <p className="text-sm text-gray-500">{tutor.is_verified ? 'Verified tutor' : 'Verification in progress'}</p>
                            </div>
                            <nav className="space-y-2 hidden lg:block">
                                {([
                                    ['overview', 'Earnings', DollarSign],
                                    ['requests', 'Booking Requests', Calendar],
                                    ['sessions', 'My Sessions', Users],
                                    ['availability', 'Availability', Calendar],
                                    ['messages', 'Messages', MessageCircle],
                                ] as const).map(([key, label, Icon]) => (
                                    <button
                                        key={key}
                                        onClick={() => setTab(key)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-left transition-colors ${
                                            tab === key ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>
                                            {label}
                                            {key === 'requests' && stats.pendingCount ? ` (${stats.pendingCount})` : ''}
                                            {key === 'messages' && stats.unreadMessages ? ` (${stats.unreadMessages})` : ''}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                            {/* Mobile tab switcher */}
                            <div className="flex gap-2 flex-wrap lg:hidden">
                                {([
                                    ['overview', 'Overview'],
                                    ['requests', `Requests${stats.pendingCount ? ` (${stats.pendingCount})` : ''}`],
                                    ['sessions', 'Sessions'],
                                    ['availability', 'Availability'],
                                    ['messages', `Messages${stats.unreadMessages ? ` (${stats.unreadMessages})` : ''}`],
                                ] as const).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setTab(key)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            tab === key ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* Main card */}
                        <div className="bg-white rounded-2xl p-6 md:p-8">

                {/* Overview */}
                {tab === 'overview' && (
                    <div>
                        {/* Earnings Overview — navy balance card from the homepage design */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-outfit)' }}>Earnings Overview</h2>
                        <div className="bg-secondary rounded-2xl p-6 mb-8">
                            <p className="text-sm text-gray-300 mb-2">Available Balance</p>
                            <p className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>{naira(stats.earningsTotal)}</p>
                            <button
                                onClick={() => toast.info('Payouts to bank are coming soon — your earnings are safely tracked.')}
                                className="bg-white text-secondary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Withdraw to Bank
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                New requests <ChevronRight className="w-4 h-4 text-gray-400" />
                            </h2>
                            {incoming.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
                                    No pending requests right now.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {incoming.slice(0, 3).map((b) => <BookingCard key={b.id} b={b} actions="request" />)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                Upcoming Classes <ChevronRight className="w-4 h-4 text-gray-400" />
                            </h2>
                            {upcoming.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
                                    No upcoming sessions yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {upcoming.slice(0, 3).map((b) => <BookingCard key={b.id} b={b} />)}
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                )}

                {/* Requests */}
                {tab === 'requests' && (
                    <div className="space-y-4">
                        {incoming.length === 0
                            ? <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400">No pending booking requests.</div>
                            : incoming.map((b) => <BookingCard key={b.id} b={b} actions="request" />)}
                    </div>
                )}

                {/* Sessions */}
                {tab === 'sessions' && (
                    <div className="space-y-6">
                        <button
                            onClick={openInstantPicker}
                            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Start an Instant Class — pick a student and go live right now
                        </button>
                        <div>
                            <h2 className="font-bold text-gray-900 mb-3">Upcoming</h2>
                            {upcoming.length === 0
                                ? <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">Nothing scheduled yet.</div>
                                : <div className="space-y-4">{upcoming.map((b) => <BookingCard key={b.id} b={b} />)}</div>}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 mb-3">History</h2>
                            {past.length === 0
                                ? <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">No past sessions yet.</div>
                                : <div className="space-y-4">{past.map((b) => <BookingCard key={b.id} b={b} />)}</div>}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {tab === 'messages' && (
                    <div className="space-y-3">
                        {conversations.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400 text-sm">
                                No conversations yet. Parents and students can message you from your profile.
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

                {/* Availability */}
                {tab === 'availability' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="font-bold text-gray-900">Your weekly availability</h2>
                                <p className="text-sm text-gray-500">Parents see your free hours before booking. Add one or more time ranges per day.</p>
                            </div>
                            <button
                                onClick={saveAvailability}
                                disabled={!availabilityDirty || savingAvailability}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
                            >
                                {savingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Save
                            </button>
                        </div>

                        <div className="space-y-3">
                            {DAYS.map(({ key, label }) => {
                                const ranges = availability[key] || [];
                                return (
                                    <div key={key} className="flex flex-wrap items-center gap-3 border border-gray-100 rounded-xl p-3">
                                        <label className="flex items-center gap-2 w-36">
                                            <input
                                                type="checkbox"
                                                checked={ranges.length > 0}
                                                onChange={(e) => {
                                                    setAvailability((prev) => ({ ...prev, [key]: e.target.checked ? [{ from: '16:00', to: '19:00' }] : [] }));
                                                    setAvailabilityDirty(true);
                                                }}
                                                className="w-4 h-4 accent-green-600"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{label}</span>
                                        </label>
                                        <div className="flex-1 flex flex-wrap items-center gap-2">
                                            {ranges.length === 0 && <span className="text-sm text-gray-400">Not available</span>}
                                            {ranges.map((r, i) => (
                                                <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                                    <input
                                                        type="time"
                                                        value={r.from}
                                                        onChange={(e) => {
                                                            const next = [...ranges];
                                                            next[i] = { ...next[i], from: e.target.value };
                                                            setAvailability((prev) => ({ ...prev, [key]: next }));
                                                            setAvailabilityDirty(true);
                                                        }}
                                                        className="text-sm bg-transparent outline-none w-[86px]"
                                                    />
                                                    <span className="text-gray-400 text-sm">–</span>
                                                    <input
                                                        type="time"
                                                        value={r.to}
                                                        onChange={(e) => {
                                                            const next = [...ranges];
                                                            next[i] = { ...next[i], to: e.target.value };
                                                            setAvailability((prev) => ({ ...prev, [key]: next }));
                                                            setAvailabilityDirty(true);
                                                        }}
                                                        className="text-sm bg-transparent outline-none w-[86px]"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setAvailability((prev) => ({ ...prev, [key]: ranges.filter((_, j) => j !== i) }));
                                                            setAvailabilityDirty(true);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                        aria-label="Remove range"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            {ranges.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setAvailability((prev) => ({ ...prev, [key]: [...ranges, { from: '16:00', to: '19:00' }] }));
                                                        setAvailabilityDirty(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-700 p-1 flex items-center gap-1 text-sm font-medium"
                                                >
                                                    <Plus className="w-4 h-4" /> Add range
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                        </div>
                    </div>
                </div>
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
            {instantOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInstantOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Start an instant class</h3>
                            <button onClick={() => setInstantOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Pick a student — they'll see the class is live and can join immediately.</p>
                        {instantLoading ? (
                            <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
                        ) : instantStudents.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">No students yet — students you've booked with appear here.</div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {instantStudents.map((st) => (
                                    <button
                                        key={st.id}
                                        onClick={() => startInstantClass(st.id)}
                                        disabled={startingClass === st.id}
                                        className="w-full bg-gray-50 hover:bg-green-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 text-left transition-colors disabled:opacity-60"
                                    >
                                        {st.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={st.avatar_url} alt={st.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                                                {st.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="flex-1 font-semibold text-gray-900 text-sm">{st.name}</span>
                                        {startingClass === st.id && <Loader2 className="w-4 h-4 animate-spin text-green-600" />}
                                        <Radio className="w-4 h-4 text-green-600" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            </main>
        </div>
    );
}
