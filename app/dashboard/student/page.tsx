'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const checkUserRole = async () => {
            if (!user) {
                router.push('/sign-in');
                return;
            }

            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    const role = data?.role;

                    if (!role) {
                        router.push('/role-selection');
                        return;
                    }

                    if (role !== 'student' && role !== 'parent') {
                        router.push('/dashboard');
                        return;
                    }

                    setUserRole(role);
                } else {
                    router.push('/role-selection');
                }
            } catch (error) {
                console.error('Error checking user role:', error);
                router.push('/role-selection');
            } finally {
                setLoading(false);
            }
        };

        checkUserRole();
    }, [user, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9F8F6] to-white">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                    <p className="text-gray-600 font-inter text-lg">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Welcome to Your Dashboard
                    </h1>
                    <p className="text-gray-600 text-lg">
                        {userRole === 'parent' ? 'Manage your child\'s learning journey' : 'Track your learning progress and find tutors'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Find Tutors Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-xl">🔍</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Find Tutors</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Browse and connect with qualified tutors for any subject
                        </p>
                        <button
                            onClick={() => router.push('/find-tutors')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all"
                        >
                            Browse Tutors
                        </button>
                    </div>

                    {/* Favorites Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 text-xl">❤️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Favorite Tutors</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            View and manage your saved tutors
                        </p>
                        <button
                            onClick={() => router.push('/favorites')}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all"
                        >
                            View Favorites
                        </button>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 text-xl">👤</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Profile</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Manage your account settings and preferences
                        </p>
                        <button
                            onClick={() => router.push('/profile')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Overview</h2>
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                                <div className="text-gray-600">Active Sessions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                                <div className="text-gray-600">Completed Lessons</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                                <div className="text-gray-600">Hours Learned</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}