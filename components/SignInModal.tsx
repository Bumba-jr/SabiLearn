'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    tutorId?: string; // Add tutorId to automatically add to favorites after sign in
}

export function SignInModal({ isOpen, onClose, onSuccess, tutorId }: SignInModalProps) {
    const { signIn, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    if (!isOpen) return null;

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        try {
            // Store the current page and tutorId in sessionStorage for after OAuth redirect
            if (tutorId) {
                sessionStorage.setItem('pendingFavorite', tutorId);
                sessionStorage.setItem('returnUrl', window.location.pathname);
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            // The redirect will happen automatically, so we don't need to call onSuccess here
        } catch (error: any) {
            toast.error(error.message || 'Failed to authenticate with Google');
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password);
                if (error) throw error;
                toast.success('Account created successfully! Please check your email to verify your account.');
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
                toast.success('Signed in successfully!');
            }

            // If there's a tutorId, automatically add it to favorites after successful auth
            if (tutorId) {
                // Small delay to ensure auth state is updated
                setTimeout(() => {
                    onSuccess?.();
                }, 100);
            } else {
                onSuccess?.();
            }

            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full p-8 relative shadow-2xl border border-white/20">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-outfit font-bold text-gray-900 mb-2">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-600 font-inter">
                        {isSignUp
                            ? 'Create an account to save your favorite tutors'
                            : 'Sign in to save and manage your favorite tutors'
                        }
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="modal-email" className="block text-sm font-inter font-medium text-gray-700 mb-2">
                            Email address
                        </label>
                        <input
                            type="email"
                            id="modal-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none transition font-inter disabled:opacity-50"
                            placeholder="you@example.com"
                            required
                            disabled={loading || googleLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="modal-password" className="block text-sm font-inter font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="modal-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none transition font-inter disabled:opacity-50"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            disabled={loading || googleLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-inter font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 font-inter">Or continue with</span>
                    </div>
                </div>

                {/* Google Button */}
                <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading || googleLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-inter font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    {googleLoading ? 'Connecting...' : `Continue with Google`}
                </button>

                {/* Toggle Sign Up/Sign In */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600 font-inter">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-1 text-[#FF6B35] hover:text-[#FF6B35]/80 font-semibold"
                            disabled={loading || googleLoading}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}