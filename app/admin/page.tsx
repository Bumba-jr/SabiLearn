'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import {
    Users,
    UserCheck,
    UserX,
    GraduationCap,
    BookOpen,
    Shield,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Eye,
    Trash2,
} from 'lucide-react';

interface User {
    id: string;
    profile_id?: string;
    clerk_user_id: string;
    auth_user_id?: string;
    role: string;
    name?: string;
    email?: string;
    is_verified?: boolean;
    onboarding_completed: boolean;
    created_at: string;
    updated_at?: string;
    avatar_url?: string;
    intro_video_url?: string;
    degree_certificate_url?: string;
    government_id_url?: string;
    nysc_certificate_url?: string;
    bio?: string;
    subjects?: string[];
    hourly_rate?: number;
    experiences?: Array<{
        post: string;
        institute: string;
        instituteState: string;
        fromYear: string;
        toYear: string;
        description: string;
    }>;
    experience_level?: string;
    phone?: string;
    location?: string;
    grade_levels?: string[];
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

    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, [selectedRole, selectedVerified]);

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

    const handleVerify = async (userId: string, role: string, verified: boolean) => {
        try {
            setVerifyingUser(userId);
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role, verified }),
            });

            if (response.ok) {
                await fetchUsers();
                await fetchStats();
            } else {
                alert('Failed to update verification status');
            }
        } catch (error) {
            console.error('Error verifying user:', error);
            alert('Error updating verification status');
        } finally {
            setVerifyingUser(null);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        const userId = user.auth_user_id || user.clerk_user_id || user.id;

        try {
            setDeletingUser(userId);
            const response = await fetch('/api/admin/users/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authUserId: user.auth_user_id,
                    clerkUserId: user.clerk_user_id,
                    profileId: user.profile_id || user.id,
                    role: user.role
                }),
            });

            if (response.ok) {
                await fetchUsers();
                await fetchStats();
                alert('User deleted successfully');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        } finally {
            setDeletingUser(null);
        }
    };

    const handleViewUser = (user: User) => {
        setViewingUser(user);
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

    return (
        <div className="min-h-screen bg-gray-50">
            {unauthorized ? (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto p-8">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-6">
                            You don't have permission to access the admin panel. Please contact an administrator if you believe this is an error.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Your User ID: <code className="bg-gray-100 px-2 py-1 rounded">{user?.id}</code>
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <header className="bg-white border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 py-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                                    <p className="text-gray-600 mt-1">Manage users and verifications</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Logged in as</p>
                                        <p className="font-semibold text-gray-900">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <Users className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                                <p className="text-sm text-gray-600">Total Users</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <GraduationCap className="w-8 h-8 text-orange-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{stats?.totalTutors || 0}</p>
                                <p className="text-sm text-gray-600">Total Tutors</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <UserCheck className="w-8 h-8 text-green-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{stats?.verifiedTutors || 0}</p>
                                <p className="text-sm text-gray-600">Verified Tutors</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <BookOpen className="w-8 h-8 text-purple-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                                <p className="text-sm text-gray-600">Total Students</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <UserX className="w-8 h-8 text-red-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{stats?.pendingVerifications || 0}</p>
                                <p className="text-sm text-gray-600">Pending</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, or ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="tutor">Tutors</option>
                                        <option value="student">Students</option>
                                        <option value="parent">Parents</option>
                                    </select>

                                    <select
                                        value={selectedVerified}
                                        onChange={(e) => setSelectedVerified(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="true">Verified</option>
                                        <option value="false">Unverified</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Onboarding
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr key={user.auth_user_id || user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                                                                {user.name?.[0]?.toUpperCase() || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{user.name || 'No name'}</p>
                                                                <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'tutor'
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : user.role === 'student'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-purple-100 text-purple-700'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.is_verified ? (
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span className="text-sm font-medium">Verified</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-gray-500">
                                                                <XCircle className="w-4 h-4" />
                                                                <span className="text-sm font-medium">Unverified</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.onboarding_completed ? (
                                                            <span className="text-green-600 text-sm font-medium">Complete</span>
                                                        ) : (
                                                            <span className="text-yellow-600 text-sm font-medium">Incomplete</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {user.role === 'tutor' && (
                                                                <>
                                                                    {user.is_verified ? (
                                                                        <button
                                                                            onClick={() => handleVerify(user.auth_user_id || user.clerk_user_id, user.role, false)}
                                                                            disabled={verifyingUser === (user.auth_user_id || user.clerk_user_id)}
                                                                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                                                                        >
                                                                            Unverify
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleVerify(user.auth_user_id || user.clerk_user_id, user.role, true)}
                                                                            disabled={verifyingUser === (user.auth_user_id || user.clerk_user_id)}
                                                                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                                                                        >
                                                                            Verify
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => handleViewUser(user)}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user)}
                                                                disabled={deletingUser === (user.auth_user_id || user.clerk_user_id || user.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Delete user"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* View User Modal */}
            {viewingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                            <button
                                onClick={() => setViewingUser(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Profile Photo */}
                            {viewingUser.avatar_url && (
                                <div className="flex justify-center">
                                    <img
                                        src={viewingUser.avatar_url}
                                        alt={viewingUser.name}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                                    />
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Name</label>
                                    <p className="text-gray-900">{viewingUser.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Email</label>
                                    <p className="text-gray-900">{viewingUser.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Role</label>
                                    <p className="text-gray-900 capitalize">{viewingUser.role}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Status</label>
                                    <p className="text-gray-900">
                                        {viewingUser.is_verified ? (
                                            <span className="text-green-600 font-semibold">Verified</span>
                                        ) : (
                                            <span className="text-yellow-600 font-semibold">Pending</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">User ID</label>
                                    <p className="text-gray-900 text-xs break-all">{viewingUser.auth_user_id || viewingUser.clerk_user_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Created</label>
                                    <p className="text-gray-900">{new Date(viewingUser.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Bio */}
                            {viewingUser.bio && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Bio</label>
                                    <p className="text-gray-900 mt-1">{viewingUser.bio}</p>
                                </div>
                            )}

                            {/* Subjects */}
                            {viewingUser.subjects && viewingUser.subjects.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Subjects</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {viewingUser.subjects.map((subject, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                            >
                                                {subject}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Experience Level */}
                            {viewingUser.experience_level && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Experience Level</label>
                                    <p className="text-gray-900 capitalize">{viewingUser.experience_level}</p>
                                </div>
                            )}

                            {/* Experiences */}
                            {viewingUser.experiences && viewingUser.experiences.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 mb-3 block">Teaching Experience</label>
                                    <div className="space-y-4">
                                        {viewingUser.experiences.map((exp, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{exp.post}</h4>
                                                        <p className="text-sm text-gray-600">{exp.institute}</p>
                                                        {exp.instituteState && (
                                                            <p className="text-sm text-gray-500">{exp.instituteState}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500 whitespace-nowrap">
                                                        {exp.fromYear} - {exp.toYear}
                                                    </span>
                                                </div>
                                                {exp.description && (
                                                    <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hourly Rate */}
                            {viewingUser.hourly_rate && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Hourly Rate</label>
                                    <p className="text-gray-900 text-lg font-bold">₦{viewingUser.hourly_rate.toLocaleString()}</p>
                                </div>
                            )}

                            {/* Documents and Media Section */}
                            {viewingUser.role === 'tutor' && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & Media</h3>

                                    <div className="space-y-4">
                                        {/* Intro Video */}
                                        {viewingUser.intro_video_url && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 mb-2 block">Intro Video</label>
                                                <video
                                                    src={viewingUser.intro_video_url}
                                                    controls
                                                    className="w-full max-h-64 rounded-lg border border-gray-200"
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        )}

                                        {/* Degree Certificate */}
                                        {viewingUser.degree_certificate_url && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 mb-2 block">Degree Certificate</label>
                                                <a
                                                    href={viewingUser.degree_certificate_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                    <span className="font-medium">View Degree Certificate</span>
                                                </a>
                                            </div>
                                        )}

                                        {/* Government ID */}
                                        {viewingUser.government_id_url && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 mb-2 block">Government ID</label>
                                                <a
                                                    href={viewingUser.government_id_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                    <span className="font-medium">View Government ID</span>
                                                </a>
                                            </div>
                                        )}

                                        {/* NYSC Certificate */}
                                        {viewingUser.nysc_certificate_url && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 mb-2 block">NYSC Certificate</label>
                                                <a
                                                    href={viewingUser.nysc_certificate_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                    <span className="font-medium">View NYSC Certificate</span>
                                                </a>
                                            </div>
                                        )}

                                        {/* Show message if no documents */}
                                        {!viewingUser.intro_video_url &&
                                            !viewingUser.degree_certificate_url &&
                                            !viewingUser.government_id_url &&
                                            !viewingUser.nysc_certificate_url && (
                                                <p className="text-gray-500 text-sm italic">No documents or media uploaded</p>
                                            )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                {viewingUser.role === 'tutor' && (
                                    <>
                                        {viewingUser.is_verified ? (
                                            <button
                                                onClick={() => {
                                                    handleVerify(viewingUser.auth_user_id || viewingUser.clerk_user_id, viewingUser.role, false);
                                                    setViewingUser(null);
                                                }}
                                                className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                                            >
                                                Unverify User
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    handleVerify(viewingUser.auth_user_id || viewingUser.clerk_user_id, viewingUser.role, true);
                                                    setViewingUser(null);
                                                }}
                                                className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors"
                                            >
                                                Verify User
                                            </button>
                                        )}
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        handleDelete(viewingUser);
                                        setViewingUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
