'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TestAuthPage() {
    const { user, session } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/profile');
                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
            setLoading(false);
        };

        fetchProfile();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6">Auth Test Page</h1>

                <div className="space-y-6">
                    {/* User Info */}
                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold mb-3">User Info</h2>
                        {user ? (
                            <div className="bg-green-50 p-4 rounded">
                                <p className="text-sm"><strong>ID:</strong> {user.id}</p>
                                <p className="text-sm"><strong>Email:</strong> {user.email}</p>
                                <p className="text-sm"><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
                                <p className="text-sm"><strong>Created:</strong> {user.created_at}</p>
                            </div>
                        ) : (
                            <p className="text-red-600">No user found - Not signed in</p>
                        )}
                    </div>

                    {/* Session Info */}
                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold mb-3">Session Info</h2>
                        {session ? (
                            <div className="bg-blue-50 p-4 rounded">
                                <p className="text-sm"><strong>Access Token:</strong> {session.access_token.substring(0, 20)}...</p>
                                <p className="text-sm"><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
                            </div>
                        ) : (
                            <p className="text-red-600">No session found</p>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold mb-3">Profile Info</h2>
                        {loading ? (
                            <p>Loading profile...</p>
                        ) : profile && !profile.error ? (
                            <div className="bg-purple-50 p-4 rounded">
                                <p className="text-sm"><strong>Profile ID:</strong> {profile.id}</p>
                                <p className="text-sm"><strong>Role:</strong> {profile.role || 'Not set'}</p>
                                <p className="text-sm"><strong>Onboarding Complete:</strong> {profile.onboarding_completed ? 'Yes' : 'No'}</p>
                            </div>
                        ) : (
                            <p className="text-yellow-600">No profile found - Need to select role</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">Actions</h2>
                        <div className="flex gap-3">
                            <Link
                                href="/role-selection"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Go to Role Selection
                            </Link>
                            <Link
                                href="/sign-in"
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Go to Sign In
                            </Link>
                            <Link
                                href="/sign-up"
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Go to Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
