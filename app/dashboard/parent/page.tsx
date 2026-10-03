'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';
import { ChatPopup } from '@/components/ChatPopup';
import {
    Calendar, Users, Loader2, Plus, Clock, Wallet, MapPin, Video, Megaphone,
    TrendingUp, CheckCircle2, XCircle, Hourglass, GraduationCap, Search, Eye, EyeOff,
} from 'lucide-react';

interface Child {
    id: string;
    name: string;
    grade_level: string | null;
    email?: string | null;
    child_code?: string | null;
    progress: {
        totalLessons: number;
        completed: number;
        upcoming: number;
        pending: number;
        declined: number;
        cancelled: number;
        hoursLearned: number;
        subjects: string[];
        tutors: string[];
        nextSessionAt: string | null;
        lastCompletedAt: string | null;
    };
}

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
    student_id?: string;
    student?: { id: string; name: string } | null;
    tutor?: { id: string; name: string } | null;
}

const naira = (n: number) => `₦${Math.round(Number(n)).toLocaleString()}`;
const fmtDate = (ts: string) => new Date(ts).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

const STATUS_META: Record<string, { label: string; cls: string; hint?: string }> = {
    pending: { label: 'Waiting for tutor', cls: 'bg-orange-50 text-orange-600', hint: 'The tutor needs to accept before you pay.' },
    accepted: { label: 'Confirmed', cls: 'bg-green-50 text-green-600', hint: 'Confirmed — pay to lock in the lesson.' },
    completed: { label: 'Completed', cls: 'bg-blue-50 text-blue-600' },
    declined: { label: 'Declined by tutor', cls: 'bg-red-50 text-red-500', hint: 'The tutor declined this request. Try booking another time or tutor.' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
};

const GRADE_OPTIONS = ['Primary 1-3', 'Primary 4-6', 'JSS 1-3', 'SSS 1-3'];

type LessonFilter = 'all' | 'upcoming' | 'pending' | 'completed' | 'past';

export default function ParentDashboardPage() {
    const { user, session } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [children, setChildren] = useState<Child[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [notice, setNotice] = useState<string | null>(null);
    const [adminRequests, setAdminRequests] = useState<any[]>([]);
    const [showAdminChat, setShowAdminChat] = useState(false);
    const [addingChild, setAddingChild] = useState(false);
    const [newChildName, setNewChildName] = useState('');
    const [newChildGrade, setNewChildGrade] = useState(GRADE_OPTIONS[1]);
    const [childEmail, setChildEmail] = useState('');
    const [childPassword, setChildPassword] = useState('');
    const [createLogin, setCreateLogin] = useState(true);
    const [savingChild, setSavingChild] = useState(false);
    const [lessonFilter, setLessonFilter] = useState<LessonFilter>('all');
    const [childFilter, setChildFilter] = useState<string>('all');
    const [showAdminChatBanner, setShowAdminChatBanner] = useState(false);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [managingChild, setManagingChild] = useState<Child | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [liveClasses, setLiveClasses] = useState<any[]>([]);

    const loadDashboard = useCallback(async () => {
        try {
            const res = await fetch('/api/dashboard');
            if (res.status === 401) {
                router.push('/sign-in');
                return;
            }
            const data = await res.json();
            setChildren(data.children || []);
            setBookings(data.myBookings || []);
            setAdminRequests(data.adminRequests || []);
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

    const addChild = async () => {
        const name = newChildName.trim();
        if (!name || savingChild) return;
        setSavingChild(true);
        try {
            const res = await fetch('/api/parent/children', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                name,
                gradeLevel: newChildGrade,
                email: createLogin ? childEmail : undefined,
                password: createLogin ? childPassword : undefined,
            }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not add your child.');
                setNotice(data.error || null);
                return;
            }
            toast.success(data.accountCreated
                ? `${name} added! They can log in with ${data.loginEmail}.`
                : `${name} added! You can now book tutors for them.`);
            setNewChildName('');
            setChildEmail('');
            setChildPassword('');
            setCreateLogin(true);
            setAddingChild(false);
            await loadDashboard();
        } catch {
            toast.error('Could not reach the server.');
        } finally {
        }
    };

    const cancelBooking = async (b: Booking) => {
        if (!confirm(`Cancel the ${b.subject} lesson for ${childName(b)}?`)) return;
        setCancelling(b.id);
        try {
            const res = await fetch(`/api/bookings/${b.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token || ''}`,
                },
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

    // Real-time class awareness: poll for live classes every 30s
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

    const liveForChild = (childId: string) => {
        const cls = liveClasses.find((c) => c.session?.student_id === childId);
        if (!cls) return null;
        const seen = (cls.attendance || []).some((a: any) =>
            a.student_id === childId && Date.now() - new Date(a.last_seen_at).getTime() < 90_000);
        return { classId: cls.id, subject: cls.session?.subject, tutor: cls.session?.tutor?.name, present: seen };
    };

    const now = new Date();
    const upcoming = bookings.filter((b) => b.status === 'accepted' && new Date(b.scheduled_at) >= now);
    const allPending = bookings.filter((b) => b.status === 'pending');
    const completed = bookings.filter((b) => b.status === 'completed');
    const totalHours = children.reduce((sum, c) => sum + (c.progress?.hoursLearned || 0), 0);

    const visibleBookings = bookings.filter((b) => {
        if (childFilter !== 'all' && b.student_id !== childFilter) return false;
        switch (lessonFilter) {
            case 'upcoming': return b.status === 'accepted' && new Date(b.scheduled_at) >= now;
            case 'pending': return b.status === 'pending';
            case 'completed': return b.status === 'completed';
            case 'past': return ['declined', 'cancelled'].includes(b.status)
                || (b.status === 'accepted' && new Date(b.scheduled_at) < now);
            default: return true;
        }
    }).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    const childName = (b: Booking) => b.student?.name || children.find((c) => c.id === b.student_id)?.name || '—';

    if (!user && !loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-lg text-gray-600 mb-4">Sign in to view your dashboard.</p>
                        <button onClick={() => router.push('/sign-in')} className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold">Sign In</button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <Header />
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 flex flex-wrap items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
                        <p className="text-sm text-gray-500">Follow each child's lessons and progress in one place.</p>
                    </div>
                    <button
                        onClick={() => router.push('/find-tutors')}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Search className="w-4 h-4" /> Find a Tutor
                    </button>
                </div>

                {notice && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 text-sm text-orange-700">{notice}</div>
                )}

                {adminRequests.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Megaphone className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-orange-800 mb-1">The SabiLearn team has a request for you:</p>
                                {adminRequests.map((r) => (
                                    <p key={r.id} className="text-sm text-orange-700">
                                        {r.type === 'document_request' ? '📄 Document needed: ' : '❓ Info needed: '}{r.message}
                                    </p>
                                ))}
                                <button onClick={() => setShowAdminChatBanner(true)} className="mt-2 text-sm font-semibold text-orange-800 hover:underline">
                                    Reply to the team →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Child management modal */}
                {managingChild && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setManagingChild(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Manage {managingChild.name}</h3>
                                <button onClick={() => setManagingChild(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">✕</button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
                                <p><span className="text-gray-400 font-semibold">Name:</span> <span className="text-gray-900">{managingChild.name}</span></p>
                                <p><span className="text-gray-400 font-semibold">Grade:</span> <span className="text-gray-900">{managingChild.grade_level || 'Not set'}</span></p>
                                <p>
                                    <span className="text-gray-400 font-semibold">Login email:</span>{' '}
                                    {managingChild.email && !managingChild.email.includes('@parents.sabilearn.local')
                                        ? <span className="text-gray-900 font-medium">{managingChild.email}</span>
                                        : <span className="text-orange-500 italic">no login account (password change needs one)</span>}
                                </p>
                                <p><span className="text-gray-400 font-semibold">Family code:</span> <span className="font-mono font-bold text-green-700">{managingChild.child_code || '—'}</span></p>
                                <p className="text-xs text-gray-400 pt-1">Lessons and progress keep tracking under this code even if the password changes.</p>
                            </div>

                            <h4 className="text-sm font-bold text-gray-900 mb-2">Change the account password</h4>
                            <p className="text-xs text-gray-400 mb-3">
                                Sets a new password for {managingChild.name}'s login (the email stays the same). Useful if they forget it.
                            </p>
                            <div className="relative mb-4">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New password (min 6 characters)"
                                    className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!newPassword || newPassword.length < 6) {
                                        toast.error('Password must be at least 6 characters.');
                                        return;
                                    }
                                    setSavingPassword(true);
                                    try {
                                        const res = await fetch('/api/parent/children', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ childId: managingChild.id, password: newPassword }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                            toast.error(data.error || 'Could not change the password.');
                                            return;
                                        }
                                        toast.success(`${managingChild.name}'s password has been changed.`);
                                        setManagingChild(null);
                                        setNewPassword('');
                                    } catch {
                                        toast.error('Could not reach the server.');
                                    } finally {
                                    }
                                }}
                                disabled={!newPassword || savingPassword}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                {savingPassword ? 'Saving…' : 'Save new password'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Live class banner */}
                {liveClasses.length > 0 && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6">
                        {liveClasses.map((c) => {
                            const childId = c.session?.student_id;
                            const child = children.find((k) => k.id === childId);
                            const present = (c.attendance || []).some((a: any) =>
                                a.student_id === childId && Date.now() - new Date(a.last_seen_at).getTime() < 90_000);
                            return (
                                <div key={c.id} className="flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-white" /> LIVE NOW
                                    </span>
                                    <p className="text-sm text-red-800 flex-1">
                                        <span className="font-bold">{child?.name || 'Your child'}</span>'s {c.session?.subject} class with {c.session?.tutor?.name} is happening right now —{' '}
                                        {present
                                            ? <span className="font-semibold text-green-700">✓ the child is in class</span>
                                            : <span className="font-semibold">the child has NOT joined yet</span>}
                                    </p>
                                    <button
                                        onClick={() => router.push(`/class/${c.id}`)}
                                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Open Class
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Overview stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Children', value: children.length, icon: Users, color: 'text-green-600 bg-green-50' },
                        { label: 'Lessons Booked', value: bookings.length, icon: Calendar, color: 'text-blue-500 bg-blue-50' },
                        { label: 'Awaiting Tutor', value: allPending.length, icon: Hourglass, color: 'text-orange-500 bg-orange-50' },
                        { label: 'Hours Learned', value: totalHours, icon: Wallet, color: 'text-purple-500 bg-purple-50' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Each child's progress */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">My Children & Progress</h2>
                    <button
                        onClick={() => setAddingChild((v) => !v)}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Child
                    </button>
                </div>

                {addingChild && (
                    <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
                        <input
                            value={newChildName}
                            onChange={(e) => setNewChildName(e.target.value)}
                            placeholder="Child's full name"
                            className="flex-1 min-w-[180px] px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                        />
                        <select
                            value={newChildGrade}
                            onChange={(e) => setNewChildGrade(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                        >
                            {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-600 w-full">
                            <input
                                type="checkbox"
                                checked={createLogin}
                                onChange={(e) => setCreateLogin(e.target.checked)}
                                className="w-4 h-4 accent-green-600"
                            />
                            Create a login account so my child can see their own dashboard
                        </label>
                        {createLogin && (
                            <>
                                <input
                                    type="email"
                                    value={childEmail}
                                    onChange={(e) => setChildEmail(e.target.value)}
                                    placeholder="Child's email (for logging in)"
                                    className="flex-1 min-w-[180px] px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                                />
                                <input
                                    type="password"
                                    value={childPassword}
                                    onChange={(e) => setChildPassword(e.target.value)}
                                    placeholder="Password (min 6 characters)"
                                    className="flex-1 min-w-[160px] px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                                />
                            </>
                        )}
                        <button
                            onClick={addChild}
                            disabled={!newChildName.trim() || savingChild}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2"
                        >
                            {savingChild ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
                        </button>
                    </div>
                )}

                {children.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center mb-8">
                        <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 mb-1">No children added yet.</p>
                        <p className="text-xs text-gray-400">Add your child above — bookings are matched to a child so you always know which tutor is for which kid.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-5 mb-10">
                        {children.map((child) => {
                            const p = child.progress || {
                                totalLessons: 0, completed: 0, upcoming: 0, pending: 0,
                                declined: 0, cancelled: 0, hoursLearned: 0, subjects: [],
                                tutors: [], nextSessionAt: null, lastCompletedAt: null,
                            };
                            const progressPct = p.totalLessons > 0
                                ? Math.round((p.completed / p.totalLessons) * 100)
                                : 0;
                            return (
                                <div key={child.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center font-bold text-lg">
                                            {child.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900">{child.name}</p>
                                            <p className="text-xs text-gray-500">{child.grade_level || 'Grade not set'}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {child.child_code && (
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(child.child_code!); toast.success(`Code ${child.child_code} copied — share it with ${child.name}.`); }}
                                                        title="Click to copy"
                                                        className="text-[11px] font-mono font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md hover:bg-green-100 transition-colors"
                                                    >
                                                        {child.child_code} ⧉
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setManagingChild(child); setNewPassword(''); }}
                                                    className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-md transition-colors"
                                                >
                                                    Manage Account
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                                                {p.completed} lesson{p.completed === 1 ? '' : 's'} done
                                            </span>
                                            {(() => {
                                                const live = liveForChild(child.id);
                                                if (!live) return null;
                                                return live.present ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> IN CLASS NOW
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/class/${live.classId}`)}
                                                        className="text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-2 py-0.5 rounded-full"
                                                    >
                                                        Class started — join
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-1">
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                                                style={{ width: `${Math.max(progressPct, p.totalLessons > 0 ? 6 : 0)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <p className="text-[11px] text-gray-400">Learning progress</p>
                                            <p className="text-[11px] font-semibold text-gray-500">{progressPct}%</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 my-4">
                                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                                            <p className="text-lg font-bold text-gray-900">{p.completed}</p>
                                            <p className="text-[10px] text-gray-500">Completed</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                                            <p className="text-lg font-bold text-gray-900">{p.upcoming}</p>
                                            <p className="text-[10px] text-gray-500">Upcoming</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                                            <p className="text-lg font-bold text-gray-900">{p.hoursLearned}h</p>
                                            <p className="text-[10px] text-gray-500">Learned</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-gray-600">
                                        {p.nextSessionAt && (
                                            <p className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-green-600" />
                                                Next lesson: <span className="font-semibold">{fmtDate(p.nextSessionAt)} at {fmtTime(p.nextSessionAt)}</span>
                                            </p>
                                        )}
                                        {p.pending > 0 && (
                                            <p className="flex items-center gap-1.5 text-orange-600">
                                                <Hourglass className="w-3.5 h-3.5" />
                                                {p.pending} booking{p.pending === 1 ? '' : 's'} waiting for tutor approval
                                            </p>
                                        )}
                                        {p.declined > 0 && (
                                            <p className="flex items-center gap-1.5 text-red-500">
                                                <XCircle className="w-3.5 h-3.5" />
                                                {p.declined} request{p.declined === 1 ? '' : 's'} declined
                                            </p>
                                        )}
                                        {p.subjects.length > 0 && (
                                            <p className="flex items-center gap-1.5 flex-wrap">
                                                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                                                Learning: {p.subjects.join(', ')}
                                            </p>
                                        )}
                                        {p.tutors.length > 0 && (
                                            <p className="text-gray-400">Tutors: {p.tutors.join(', ')}</p>
                                        )}
                                        {!p.totalLessons && (
                                            <p className="text-gray-400">No lessons yet — book a tutor to get started.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Lessons — full lifecycle */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">All Lessons</h2>
                    <div className="flex gap-1.5 flex-wrap">
                        {([
                            ['all', 'All'],
                            ['upcoming', 'Confirmed'],
                            ['pending', 'Awaiting tutor'],
                            ['completed', 'Completed'],
                            ['past', 'Declined / Cancelled'],
                        ] as const).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setLessonFilter(key)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                                    lessonFilter === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {children.length > 1 && (
                    <div className="flex gap-1.5 flex-wrap mb-4">
                        <button
                            onClick={() => setChildFilter('all')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${childFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                        >
                            All children
                        </button>
                        {children.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setChildFilter(c.id)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${childFilter === c.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {visibleBookings.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                        <p className="text-sm text-gray-400 mb-1">No lessons in this view.</p>
                        <p className="text-xs text-gray-400 mb-4">Bookings appear here immediately — even before the tutor responds — and stay visible if declined.</p>
                        <button onClick={() => router.push('/find-tutors')} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                            Browse Tutors
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visibleBookings.map((b) => {
                            const meta = STATUS_META[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-500' };
                            const canPay = b.status === 'accepted' && b.payment_status !== 'paid';
                            return (
                                <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                                                {b.payment_status === 'paid'
                                                    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">paid</span>
                                                    : canPay && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500">payment needed</span>}
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                                    {childName(b)}
                                                </span>
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
                                            {STATUS_META[b.status]?.hint && (
                                                <p className="text-xs text-gray-400 mt-1.5">{STATUS_META[b.status].hint}</p>
                                            )}
                                            {b.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2.5">"{b.notes}"</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{b.amount != null ? naira(Number(b.amount)) : '—'}</p>
                                            {['pending', 'accepted'].includes(b.status) && (
                                                <button
                                                    onClick={() => cancelBooking(b)}
                                                    disabled={cancelling === b.id}
                                                    className="mt-2 bg-white hover:bg-red-50 disabled:opacity-50 text-red-500 border border-red-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                                                >
                                                    {cancelling === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                    Cancel
                                                </button>
                                            )}
                                            {canPay && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch('/api/payments/initialize', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ bookingId: b.id }),
                                                            });
                                                            const data = await res.json();
                                                            if (!res.ok) { toast.error(data.error || 'Could not start payment.'); return; }
                                                            window.location.href = data.authorizationUrl;
                                                        } catch { toast.error('Could not reach the payment service.'); }
                                                    }}
                                                    className="mt-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Wallet className="w-3.5 h-3.5" /> Pay now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            {(showAdminChat || showAdminChatBanner) && (
                <ChatPopup
                    isOpen
                    onClose={() => { setShowAdminChat(false); setShowAdminChatBanner(false); }}
                    withAdmin
                    tutorName="SabiLearn Team"
                />
            )}
            <Footer />
        </div>
    );
}
