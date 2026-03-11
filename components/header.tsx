'use client';

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export function Header() {
    const { user, signOut } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [favoritesCount, setFavoritesCount] = useState(0);

    useEffect(() => {
        async function fetchUserRole() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    setUserRole(data?.role || null);
                }
            } catch (error) {
                console.error('Failed to fetch user role:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUserRole();
    }, [user]);

    // Load favorites count from localStorage (user-specific)
    useEffect(() => {
        if (user) {
            const userFavoritesKey = `savedTutors_${user.id}`;
            const savedTutorIds = localStorage.getItem(userFavoritesKey);
            if (savedTutorIds) {
                try {
                    const parsedIds = JSON.parse(savedTutorIds);
                    setFavoritesCount(parsedIds.length);
                } catch (error) {
                    console.error('Error loading saved tutors count:', error);
                    setFavoritesCount(0);
                }
            } else {
                setFavoritesCount(0);
            }
        } else {
            setFavoritesCount(0);
        }
    }, [user]);

    // Listen for storage changes and custom events to update count (user-specific)
    useEffect(() => {
        const handleFavoritesChange = () => {
            if (user) {
                const userFavoritesKey = `savedTutors_${user.id}`;
                const savedTutorIds = localStorage.getItem(userFavoritesKey);
                if (savedTutorIds) {
                    try {
                        const parsedIds = JSON.parse(savedTutorIds);
                        setFavoritesCount(parsedIds.length);
                    } catch (error) {
                        setFavoritesCount(0);
                    }
                } else {
                    setFavoritesCount(0);
                }
            }
        };

        window.addEventListener('storage', handleFavoritesChange);
        window.addEventListener('favoritesChanged', handleFavoritesChange);

        return () => {
            window.removeEventListener('storage', handleFavoritesChange);
            window.removeEventListener('favoritesChanged', handleFavoritesChange);
        };
    }, [user]);

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">SL</span>
                    </div>
                    <span className="text-xl font-bold text-secondary">SabiLearn</span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/find-tutors" className="text-foreground/70 hover:text-foreground transition-colors">
                        Find Tutors
                    </Link>
                    <Link href="/how-it-works" className="text-foreground/70 hover:text-foreground transition-colors">
                        How it Works
                    </Link>
                    <Link href="/safety" className="text-foreground/70 hover:text-foreground transition-colors">
                        Safety
                    </Link>
                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <div className="flex items-center gap-3">
                                {/* Favorites Heart Icon */}
                                <Link href="/favorites" className="relative text-foreground/70 hover:text-foreground transition-colors mr-2">
                                    <Heart className="w-7 h-7" />
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 p-3 flex items-center justify-center font-semibold">
                                            {favoritesCount}
                                        </span>
                                    )}
                                </Link>

                                {/* User Avatar */}
                                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                            {/* Dashboard Button - Show for all authenticated users */}
                            <Link
                                href="/dashboard"
                                className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                            >
                                Dashboard
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/sign-in" className="text-foreground/70 hover:text-foreground transition-colors">
                                Log in
                            </Link>
                            <Link
                                href="/become-tutor"
                                className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                            >
                                Become a Tutor
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
