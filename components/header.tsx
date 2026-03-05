'use client';

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function Header() {
    const { isSignedIn, user } = useUser();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchUserRole() {
            if (!isSignedIn) {
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
    }, [isSignedIn]);

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
                    {isSignedIn ? (
                        <>
                            <UserButton afterSignOutUrl="/" />
                            {!isLoading && userRole === 'tutor' && (
                                <Link
                                    href="/dashboard/tutor"
                                    className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                                >
                                    Dashboard
                                </Link>
                            )}
                            {!isLoading && (userRole === 'student' || userRole === 'parent') && (
                                <Link
                                    href="/dashboard"
                                    className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                                >
                                    Dashboard
                                </Link>
                            )}
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
