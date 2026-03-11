'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the session from the URL hash
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Auth callback error:', error);
                    router.push('/sign-in');
                    return;
                }

                if (!session) {
                    router.push('/sign-in');
                    return;
                }

                // Check for pending favorite and return URL from sessionStorage
                const pendingFavorite = sessionStorage.getItem('pendingFavorite');
                const returnUrl = sessionStorage.getItem('returnUrl');

                if (pendingFavorite && returnUrl) {
                    // Clear the session storage
                    sessionStorage.removeItem('pendingFavorite');
                    sessionStorage.removeItem('returnUrl');

                    // Add the tutor to favorites
                    const userFavoritesKey = `savedTutors_${session.user.id}`;
                    const existingFavorites = localStorage.getItem(userFavoritesKey);
                    let favorites = [];

                    if (existingFavorites) {
                        try {
                            favorites = JSON.parse(existingFavorites);
                        } catch (e) {
                            favorites = [];
                        }
                    }

                    if (!favorites.includes(pendingFavorite)) {
                        favorites.push(pendingFavorite);
                        localStorage.setItem(userFavoritesKey, JSON.stringify(favorites));
                    }

                    // Return to the original page with success indicator
                    router.push(`${returnUrl}?favoriteAdded=true`);
                    return;
                }

                // Check if user has a profile and if onboarding is completed
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, onboarding_completed')
                    .eq('auth_user_id', session.user.id)
                    .single();

                if (profileError) {
                    console.log('No profile found, redirecting to role selection');
                    router.push('/role-selection');
                    return;
                }

                // If onboarding is completed and user has a role, redirect to dashboard
                if (profile.onboarding_completed && profile.role) {
                    console.log('Onboarding completed, redirecting to dashboard');
                    router.push(`/dashboard/${profile.role}`);
                    return;
                }

                // If user has a role but hasn't completed onboarding, redirect to onboarding
                if (profile.role && !profile.onboarding_completed) {
                    console.log('Onboarding not completed, redirecting to onboarding');
                    router.push(`/onboarding/${profile.role}`);
                    return;
                }

                // Otherwise, redirect to role selection
                console.log('No role found, redirecting to role selection');
                router.push('/role-selection');
            } catch (error) {
                console.error('Callback error:', error);
                router.push('/sign-in');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#FF6B35]/20">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-white font-inter text-lg">Completing sign in...</p>
            </div>
        </div>
    );
}
