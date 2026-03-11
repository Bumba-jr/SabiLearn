'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUserRole = async () => {
            if (!user) {
                router.push('/sign-in');
                return;
            }

            console.log('Checking user role for user:', user.id); // Debug log

            try {
                // Try direct Supabase query first
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, onboarding_completed')
                    .eq('auth_user_id', user.id)
                    .single();

                console.log('Profile data:', profile, 'Error:', profileError); // Debug log

                if (profileError) {
                    console.log('Profile error, redirecting to role selection'); // Debug log
                    router.push('/role-selection');
                    return;
                }

                const userRole = profile?.role;

                if (!userRole) {
                    console.log('No role found, redirecting to role selection'); // Debug log
                    router.push('/role-selection');
                    return;
                }

                console.log('User role found:', userRole); // Debug log

                // User has a role, redirect to appropriate dashboard
                if (userRole === 'tutor') {
                    console.log('Redirecting to tutor dashboard'); // Debug log
                    router.push('/dashboard/tutor');
                } else if (userRole === 'student' || userRole === 'parent') {
                    console.log('Redirecting to student dashboard'); // Debug log
                    router.push('/dashboard/student');
                } else {
                    console.log('Unknown role, redirecting to role selection'); // Debug log
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

    // This should not be reached as we redirect in useEffect
    return null;
}