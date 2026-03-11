'use client';

import { useAuth } from '@/lib/auth/AuthProvider';

export function SignOutButton() {
    const { signOut } = useAuth();

    return (
        <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-inter font-medium transition-colors"
        >
            Sign Out
        </button>
    );
}
