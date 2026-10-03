'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Users, GraduationCap, BookOpen, Shield, Search,
    CheckCircle, XCircle, Eye, Trash2, Loader2, RefreshCw, FileText,
    ExternalLink, X, BadgeCheck, Clock, Video as VideoIcon, Image as ImageIcon,
    MessageCircle, Flag, Send,
} from 'lucide-react';
import { ChatPopup } from '@/components/ChatPopup';

interface DocumentFile {
    type: string;
    url: string;
    filename: string;
    mimeType: string;
}

interface User {
    id: string;
    profile_id?: string;
    clerk_user_id: string;
    auth_user_id?: string;
    role: string;
    name?: string;
    email?: string;
    phone?: string;
    is_verified?: boolean;
    onboarding_completed: boolean;
    created_at: string;
    updated_at?: string;
    avatar_url?: string;
    intro_video_url?: string;
    degree_certificate_url?: string;
    government_id_url?: string;
    nysc_certificate_url?: string;
    documents?: DocumentFile[];
    bio?: string;
    subjects?: string[];
    grade_levels?: string[];
    hourly_rate?: number;
    location?: string;
    experiences?: Array<{
        post: string;
        institute: string;
        instituteState: string;
        fromYear: string;
        toYear: string;
        description: string;
    }>;
    experience_level?: string;
    is_available?: boolean;
    rating?: number;
    total_reviews?: number;
}

interface Stats {
    totalUsers: number;
    totalTutors: number;
    verifiedTutors: number;
    totalStudents: number;
    pendingVerifications: number;
}

const naira = (n: number) => `₦${Math.round(Number(n)).toLocaleString()}`;

function DocPreview({ doc }: { doc: DocumentFile }) {
    const isImage = doc.mimeType?.startsWith('image/');
    const isHeic = /\.heic$/i.test(doc.url) || doc.mimeType === 'image/heic' || doc.mimeType === 'image/heif';
    const isPdf = doc.mimeType === 'application/pdf';
    const isVideo = doc.mimeType?.startsWith('video/');

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    {isImage ? <ImageIcon className="w-3.5 h-3.5" /> : isVideo ? <VideoIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    {doc.type}
                </p>
                <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 hover:underline flex items-center gap-1"
                >
                    Open <ExternalLink className="w-3 h-3" />
                </a>
            </div>
            <div className="p-2 flex items-center justify-center min-h-[160px]">
                {isImage && isHeic ? (
                    <div className="text-center text-sm text-gray-500 p-6">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        HEIC photo (iPhone format) — browsers can't preview it.
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline block mt-1">Open to download</a>
                    </div>
                ) : isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.url} alt={doc.type} className="max-h-72 rounded-lg object-contain" />
                ) : isPdf ? (
                    <object data={doc.url} type="application/pdf" className="w-full h-72 rounded-lg">
                        <div className="text-center text-sm text-gray-500 p-6">
                            PDF preview not supported here.
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline block mt-1">Open the PDF</a>
                        </div>
                    </object>
                ) : isVideo ? (
                    <video src={doc.url} controls className="max-h-72 w-full rounded-lg" />
                ) : (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:underline flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> Download {doc.filename}
                    </a>
                )}
            </div>
            {doc.filename && <p className="px-3 py-1.5 text-[11px] text-gray-400 truncate">{doc.filename}</p>}
        </div>
    );
}

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedVerified, setSelectedVerified] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [verifyingUser, setVerifyingUser] = useState<string | null>(null);
    const [deletingUser, setDeletingUser] = useState<string | null>(null);
    const [unauthorized, setUnauthorized] = useState(false);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [view, setView] = useState<'users' | 'messages' | 'reports'>('users');
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
    const [chatWithUser, setChatWithUser] = useState<{ userId: string; name: string } | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [reportFilter, setReportFilter] = useState<'open' | 'reviewing' | 'resolved'>('open');
    const [updatingReport, setUpdatingReport] = useState<string | null>(null);
    const [requestForm, setRequestForm] = useState<{ type: string; message: string } | null>(null);
    const [sendingRequest, setSendingRequest] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, [selectedRole, selectedVerified]);

    useEffect(() => {
        (async () => {
            const [msgRes, repRes] = await Promise.all([
                fetch('/api/messages'),
                fetch('/api/reports'),
            ]);
            if (msgRes.ok) {
                const data = await msgRes.json();
                setConversations(data.conversations || []);
            }
            if (repRes.ok) {
                const data = await repRes.json();
                setReports(data.reports || []);
            }
        })();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();

            if (response.ok) {
                setStats(data.stats);
            } else if (response.status === 403) {
                setUnauthorized(true);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedRole !== 'all') params.append('role', selectedRole);
            if (selectedVerified !== 'all') params.append('verified', selectedVerified);

            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json();

            if (response.ok) {
                setUsers(data.users || []);
            } else if (response.status === 403) {
                setUnauthorized(true);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (u: User, verified: boolean) => {
        const userId = u.auth_user_id || u.clerk_user_id || u.id;
        try {
            setVerifyingUser(userId);
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: u.role, verified }),
            });

            if (response.ok) {
                toast.success(verified ? `${u.name || 'User'} verified — now live on Find Tutors.` : `${u.name || 'User'} unverified.`);
                if (viewingUser?.id === u.id) setViewingUser({ ...viewingUser, is_verified: verified });
                await fetchUsers();
                await fetchStats();
            } else {
                const data = await response.json().catch(() => ({}));
                toast.error(data.error || 'Failed to update verification status');
            }
        } catch (error) {
            console.error('Error verifying user:', error);
            toast.error('Error updating verification status');
        } finally {
            setVerifyingUser(null);
        }
    };

    const handleDelete = async (u: User) => {
        if (!confirm(`Permanently delete ${u.name || 'this user'}? This cannot be undone.`)) {
            return;
        }

        const userId = u.auth_user_id || u.clerk_user_id || u.id;

        try {
            setDeletingUser(userId);
            const response = await fetch('/api/admin/users/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authUserId: u.auth_user_id,
                    clerkUserId: u.clerk_user_id,
                    profileId: u.profile_id || u.id,
                    role: u.role
                }),
            });

            if (response.ok) {
                toast.success('User deleted');
                if (viewingUser?.id === u.id) setViewingUser(null);
                await fetchUsers();
                await fetchStats();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Error deleting user');
        } finally {
            setDeletingUser(null);
        }
    };

    const refreshInbox = async () => {
        const [msgRes, repRes] = await Promise.all([fetch('/api/messages'), fetch('/api/reports')]);
        if (msgRes.ok) setConversations((await msgRes.json()).conversations || []);
        if (repRes.ok) setReports((await repRes.json()).reports || []);
    };

    const sendAdminRequest = async () => {
        if (!viewingUser || !requestForm?.message.trim()) return;
        setSendingRequest(true);
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: viewingUser.auth_user_id || viewingUser.clerk_user_id,
                    type: requestForm.type,
                    message: requestForm.message,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not create the request.');
                return;
            }
            toast.success('Request sent — the user will see it on their dashboard.');
            setRequestForm(null);
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setSendingRequest(false);
        }
    };

    const updateReport = async (id: string, status: string) => {
        setUpdatingReport(id);
        try {
            const res = await fetch('/api/reports', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not update the report.');
                return;
            }
            setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
            toast.success(`Report marked ${status}.`);
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setUpdatingReport(null);
        }
    };

    const filteredUsers = users.filter((user) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.clerk_user_id.toLowerCase().includes(query)
        );
    });

    const roleBadge = (role: string) => {
        const map: Record<string, string> = {
            tutor: 'bg-blue-50 text-blue-700 border-blue-100',
            student: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            parent: 'bg-green-50 text-green-700 border-green-100',
        };
        return map[role] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    if (unauthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-500 mb-6">You don't have permission to access the admin panel.</p>
                    <button onClick={() => router.push('/')} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold">Back Home</button>
                </div>
            </div>
        );
    }

    const statCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-gray-100 text-gray-600' },
        { label: 'Tutors', value: stats.totalTutors, icon: GraduationCap, color: 'bg-blue-50 text-blue-600' },
        { label: 'Verified Tutors', value: stats.verifiedTutors, icon: BadgeCheck, color: 'bg-green-50 text-green-600' },
        { label: 'Students', value: stats.totalStudents, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Pending Review', value: stats.pendingVerifications, icon: Clock, color: 'bg-orange-50 text-orange-600' },
    ] : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">Admin Console</h1>
                        <p className="text-xs text-gray-400">
                            {user?.email || 'SabiLearn'} · Manage users, verify tutors, review documents
                        </p>
                    </div>
                    <button
                        onClick={() => { fetchUsers(); fetchStats(); }}
                        className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* View switcher */}
                <div className="flex gap-2 mb-6">
                    {([
                        ['users', `Users${stats?.pendingVerifications ? ` (${stats.pendingVerifications} pending)` : ''}`],
                        ['messages', 'Messages'],
                        ['reports', 'Reports'],
                    ] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setView(key)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                                view === key ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {key === 'messages' && <MessageCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                            {key === 'reports' && <Flag className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                            {label}
                        </button>
                    ))}
                </div>

                {view === 'messages' && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 mb-2">Every conversation on the platform. Open one to ask a tutor or user a question.</p>
                        {conversations.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400 text-sm">
                                No conversations yet.
                            </div>
                        ) : conversations.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveChat({ id: c.id, name: c.otherName, avatar: c.otherAvatar })}
                                className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 text-left hover:border-green-300 transition-colors"
                            >
                                <div className="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    {c.otherName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900 text-sm">{c.otherName}</p>
                                        {c.category === 'support' && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">support</span>}
                                        {c.category === 'report' && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600">report</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{c.lastMessage || 'No messages yet'}</p>
                                </div>
                                <p className="text-[10px] text-gray-400 shrink-0">
                                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}
                                </p>
                            </button>
                        ))}
                    </div>
                )}

                {view === 'reports' && (
                    <div className="space-y-3">
                        <div className="flex gap-1.5 mb-2">
                            {(['open', 'reviewing', 'resolved'] as const).map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setReportFilter(st)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${reportFilter === st ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {st.charAt(0).toUpperCase() + st.slice(1)}
                                </button>
                            ))}
                        </div>
                        {reports.filter((r) => r.status === reportFilter).length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400 text-sm">
                                No {reportFilter} reports.
                            </div>
                        ) : reports.filter((r) => r.status === reportFilter).map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <Flag className="w-4 h-4 text-red-500" /> {r.reason}
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'open' ? 'bg-orange-50 text-orange-600' : r.status === 'reviewing' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>{r.status}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Reported tutor: <span className="font-medium text-gray-700">{r.tutor?.name || 'Unknown'}</span>
                                            {' · by '}{r.reporterName}
                                            {' · '}{new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                        </p>
                                        {r.details && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">"{r.details}"</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        {r.status !== 'resolved' && r.status !== 'reviewing' && (
                                            <button
                                                onClick={() => updateReport(r.id, 'reviewing')}
                                                disabled={updatingReport === r.id}
                                                className="text-xs font-semibold px-3 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                Mark reviewing
                                            </button>
                                        )}
                                        {r.status !== 'resolved' && (
                                            <button
                                                onClick={() => updateReport(r.id, 'resolved')}
                                                disabled={updatingReport === r.id}
                                                className="text-xs font-semibold px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'users' && (<>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {statCards.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or ID..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {[['all', 'All'], ['tutor', 'Tutors'], ['student', 'Students'], ['parent', 'Parents']].map(([v, l]) => (
                            <button
                                key={v}
                                onClick={() => setSelectedRole(v)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedRole === v ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {l}
                            </button>
                        ))}
                        <span className="w-px bg-gray-200 mx-1" />
                        {[['all', 'Any status'], ['pending', 'Pending'], ['verified', 'Verified'], ['unverified', 'Unverified']].map(([v, l]) => (
                            <button
                                key={v}
                                onClick={() => setSelectedVerified(v)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedVerified === v ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-16 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-16 text-center text-gray-400 text-sm">No users match these filters.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                                        <th className="px-5 py-3 font-semibold">User</th>
                                        <th className="px-5 py-3 font-semibold">Role</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Documents</th>
                                        <th className="px-5 py-3 font-semibold">Joined</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => {
                                        const docCount = [u.degree_certificate_url, u.government_id_url, u.nysc_certificate_url, u.intro_video_url].filter(Boolean).length;
                                        return (
                                            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {u.avatar_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={u.avatar_url} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center text-xs font-bold">
                                                                {(u.name || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{u.name || 'Unnamed'}</p>
                                                            <p className="text-xs text-gray-400">{u.email || u.clerk_user_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge(u.role)}`}>{u.role}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {u.is_verified ? (
                                                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold"><BadgeCheck className="w-4 h-4" /> Verified</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-semibold"><Clock className="w-4 h-4" /> Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-xs font-medium ${docCount > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                                                        {docCount} file{docCount === 1 ? '' : 's'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-gray-500">
                                                    {new Date(u.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setViewingUser(u)}
                                                            title="View details & documents"
                                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {u.role === 'tutor' && (
                                                            u.is_verified ? (
                                                                <button
                                                                    onClick={() => handleVerify(u, false)}
                                                                    disabled={verifyingUser === (u.auth_user_id || u.id)}
                                                                    title="Unverify"
                                                                    className="p-2 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors disabled:opacity-50"
                                                                >
                                                                    {verifyingUser === (u.auth_user_id || u.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleVerify(u, true)}
                                                                    disabled={verifyingUser === (u.auth_user_id || u.id)}
                                                                    title="Verify (accept)"
                                                                    className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                                                                >
                                                                    {verifyingUser === (u.auth_user_id || u.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                                </button>
                                                            )
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(u)}
                                                            disabled={deletingUser === (u.auth_user_id || u.id)}
                                                            title="Delete user"
                                                            className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                                                        >
                                                            {deletingUser === (u.auth_user_id || u.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                </>)}
            </main>

            {/* User detail drawer */}
            {viewingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setViewingUser(null)}>
                    <div
                        className="bg-white w-full max-w-3xl h-full overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 z-10">
                            {viewingUser.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={viewingUser.avatar_url} alt={viewingUser.name} className="w-12 h-12 rounded-2xl object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center text-lg font-bold">
                                    {(viewingUser.name || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-gray-900 truncate">{viewingUser.name || 'Unnamed user'}</h2>
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge(viewingUser.role)}`}>{viewingUser.role}</span>
                                    {viewingUser.is_verified
                                        ? <span className="text-green-600 font-medium">Verified</span>
                                        : <span className="text-orange-500 font-medium">Pending review</span>}
                                </p>
                            </div>
                            <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Contact info */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    ['Email', viewingUser.email],
                                    ['Phone', viewingUser.phone],
                                    ['Location', viewingUser.location],
                                    ['Hourly rate', viewingUser.hourly_rate ? naira(viewingUser.hourly_rate) : null],
                                    ['User ID', viewingUser.auth_user_id || viewingUser.clerk_user_id],
                                    ['Joined', new Date(viewingUser.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })],
                                ].filter(([, v]) => v).map(([label, value]) => (
                                    <div key={label as string} className="bg-gray-50 rounded-xl px-4 py-3">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase">{label as string}</p>
                                        <p className="text-sm text-gray-900 break-all">{value as string}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Bio */}
                            {viewingUser.bio && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Bio</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{viewingUser.bio}</p>
                                </div>
                            )}

                            {/* Subjects & levels */}
                            {(viewingUser.subjects?.length || viewingUser.grade_levels?.length) ? (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Teaching</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingUser.subjects?.map((s) => (
                                            <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">{s}</span>
                                        ))}
                                        {viewingUser.grade_levels?.map((g) => (
                                            <span key={g} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">{g}</span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Experience */}
                            {viewingUser.experiences && viewingUser.experiences.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Experience</h3>
                                    <div className="space-y-3">
                                        {viewingUser.experiences.map((exp, i) => (
                                            <div key={i} className="border border-gray-100 rounded-xl p-4">
                                                <p className="font-semibold text-gray-900 text-sm">{exp.post || 'Role'} — {exp.institute || 'Institute'}</p>
                                                <p className="text-xs text-gray-400 mb-1">{exp.instituteState} · {exp.fromYear}–{exp.toYear}</p>
                                                {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Documents — inline previews */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Submitted documents</h3>
                                {(viewingUser.documents && viewingUser.documents.length > 0) ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {viewingUser.documents.map((doc) => <DocPreview key={doc.url} doc={doc} />)}
                                    </div>
                                ) : viewingUser.degree_certificate_url || viewingUser.government_id_url || viewingUser.nysc_certificate_url || viewingUser.intro_video_url ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            viewingUser.degree_certificate_url && { type: 'Degree Certificate', url: viewingUser.degree_certificate_url, filename: '', mimeType: '' },
                                            viewingUser.government_id_url && { type: 'Government ID', url: viewingUser.government_id_url, filename: '', mimeType: '' },
                                            viewingUser.nysc_certificate_url && { type: 'NYSC Certificate', url: viewingUser.nysc_certificate_url, filename: '', mimeType: '' },
                                            viewingUser.intro_video_url && { type: 'Intro Video', url: viewingUser.intro_video_url, filename: '', mimeType: '' },
                                        ].filter(Boolean).map((doc) => <DocPreview key={(doc as DocumentFile).url} doc={doc as DocumentFile} />)}
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 text-sm">
                                        No documents uploaded.
                                    </div>
                                )}
                            </div>

                            {/* Admin tools: chat + requests */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Admin tools</h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <button
                                        onClick={() => setChatWithUser({ userId: viewingUser.auth_user_id || viewingUser.clerk_user_id, name: viewingUser.name || 'User' })}
                                        className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4" /> Message user
                                    </button>
                                    <button
                                        onClick={() => setRequestForm({ type: 'document_request', message: '' })}
                                        className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" /> Request document / info
                                    </button>
                                </div>
                                {requestForm && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                        <div className="flex gap-2">
                                            {['document_request', 'info_request'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setRequestForm((f) => ({ ...(f || { message: '' }), type: t }))}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${requestForm.type === t ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                                                >
                                                    {t === 'document_request' ? 'Document request' : 'More info'}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={requestForm.message}
                                            onChange={(e) => setRequestForm((f) => ({ ...(f || { type: 'document_request' }), message: e.target.value }))}
                                            rows={3}
                                            placeholder={requestForm.type === 'document_request'
                                                ? 'e.g. Please upload a clearer photo of your government ID for verification.'
                                                : 'e.g. Can you confirm your availability for weekend lessons?'}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600 resize-none"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setRequestForm(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                                            <button
                                                onClick={sendAdminRequest}
                                                disabled={!requestForm.message.trim() || sendingRequest}
                                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                                            >
                                                {sendingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send request
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 pt-2 pb-6">
                                {viewingUser.role === 'tutor' && !viewingUser.is_verified && (
                                    <button
                                        onClick={() => handleVerify(viewingUser, true)}
                                        disabled={verifyingUser === (viewingUser.auth_user_id || viewingUser.id)}
                                        className="flex-1 min-w-[160px] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {verifyingUser === (viewingUser.auth_user_id || viewingUser.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-5 h-5" />}
                                        Accept & Verify
                                    </button>
                                )}
                                {viewingUser.role === 'tutor' && viewingUser.is_verified && (
                                    <button
                                        onClick={() => handleVerify(viewingUser, false)}
                                        disabled={verifyingUser === (viewingUser.auth_user_id || viewingUser.id)}
                                        className="flex-1 min-w-[160px] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <XCircle className="w-5 h-5" /> Unverify (remove from Find Tutors)
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(viewingUser)}
                                    disabled={deletingUser === (viewingUser.auth_user_id || viewingUser.id)}
                                    className="bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(activeChat || chatWithUser) && (
                <ChatPopup
                    isOpen
                    onClose={async () => {
                        setActiveChat(null);
                        setChatWithUser(null);
                        await refreshInbox();
                    }}
                    conversationId={activeChat?.id}
                    userId={chatWithUser?.userId}
                    tutorName={activeChat?.name || chatWithUser?.name || 'Chat'}
                    tutorAvatar={activeChat?.avatar}
                />
            )}
        </div>
    );
}
