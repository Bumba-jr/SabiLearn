'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';

// Minimal sign-out control for dashboards, which render without the site header.
export function SignOutButton({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const { signOut } = useAuth();

    const styles = variant === 'dark'
        ? 'border border-white/30 text-white/90 hover:bg-white/10 hover:text-white'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700';

    return (
        <button
            onClick={() => signOut()}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${styles}`}
        >
            <LogOut className="w-4 h-4" />
            Sign Out
        </button>
    );
}
