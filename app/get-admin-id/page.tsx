'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function GetAdminIdPage() {
    const { user, loading } = useAuth();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Get Your Admin User ID</h1>
                <p className="text-gray-600 mb-6">
                    Copy your Supabase User ID to set up admin access
                </p>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : user ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Your Supabase User ID:
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-gray-100 p-4 rounded-lg text-sm break-all font-mono border border-gray-200">
                                    {user.id}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-5 h-5" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                <li>Copy your User ID above</li>
                                <li>Open <code className="bg-blue-100 px-2 py-0.5 rounded">.env.local</code> file</li>
                                <li>Add or update: <code className="bg-blue-100 px-2 py-0.5 rounded">ADMIN_USER_ID=your_user_id</code></li>
                                <li>Restart your development server</li>
                                <li>Navigate to <code className="bg-blue-100 px-2 py-0.5 rounded">/admin</code></li>
                            </ol>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Example .env.local entry:</h3>
                            <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
                                ADMIN_USER_ID={user.id}
                            </code>
                        </div>

                        <div className="flex gap-3">
                            <a
                                href="/admin"
                                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center"
                            >
                                Go to Admin Panel
                            </a>
                            <a
                                href="/"
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
                            >
                                Go to Home
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Please sign in to view your User ID</p>
                        <a
                            href="/sign-in"
                            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            Sign In
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
