'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await resetPassword(email);

        if (error) {
            toast.error(error.message || 'Failed to send reset email');
            setLoading(false);
        } else {
            toast.success('Password reset email sent!');
            setSent(true);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#FF6B35]/20 p-4">
            <div className="w-full max-w-md">
                <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 text-white hover:text-gray-200 mb-8 font-inter"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-outfit font-bold text-white mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-300 font-inter">
                        Enter your email to receive a reset link
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-inter font-medium text-gray-700 mb-2">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none transition font-inter"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-inter font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-inter">
                                Check your email
                            </h3>
                            <p className="text-gray-600 mb-6 font-inter">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <Link
                                href="/sign-in"
                                className="text-[#FF6B35] hover:text-[#FF6B35]/80 font-inter font-semibold"
                            >
                                Return to sign in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
