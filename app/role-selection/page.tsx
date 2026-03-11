'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { Presentation, GraduationCap, Users, HelpCircle, X, BookOpen } from 'lucide-react';

type Role = 'tutor' | 'student' | 'parent';

interface RoleCardData {
    role: Role;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    themeColor: string;
    lightBg: string;
    darkBg: string;
}

const roleCards: RoleCardData[] = [
    {
        role: 'tutor',
        icon: Presentation,
        title: 'Tutor',
        description: 'Share your knowledge and earn by teaching students worldwide.',
        themeColor: '#FF6B35',
        lightBg: '#FFF5F2',
        darkBg: '#FFE5DC',
    },
    {
        role: 'student',
        icon: GraduationCap,
        title: 'Student',
        description: 'Find expert tutors to help you excel in your studies and exams.',
        themeColor: '#4F46E5',
        lightBg: '#EEF2FF',
        darkBg: '#E0E7FF',
    },
    {
        role: 'parent',
        icon: Users,
        title: 'Parent',
        description: "Find qualified and trusted tutors for your child's education.",
        themeColor: '#10B981',
        lightBg: '#F0FDF4',
        darkBg: '#D1FAE5',
    },
];

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

function BouncingBalls() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [balls, setBalls] = useState<Ball[]>([
        { x: 180, y: 180, vx: 0.5, vy: 0.3, radius: 12 },
        { x: 130, y: 150, vx: -0.3, vy: 0.4, radius: 12 },
        { x: 150, y: 120, vx: 0.4, vy: -0.35, radius: 12 },
    ]);

    // Quarter-circle container properties
    const containerSize = 256;
    const circleRadius = 256;

    useEffect(() => {
        const animate = () => {
            setBalls(prevBalls => {
                const newBalls = prevBalls.map(ball => ({ ...ball }));

                newBalls.forEach(ball => {
                    // Update position
                    ball.x += ball.vx;
                    ball.y += ball.vy;

                    // Calculate distance from bottom-right corner
                    const dx = ball.x - containerSize;
                    const dy = ball.y - containerSize;
                    const distanceFromCorner = Math.sqrt(dx * dx + dy * dy);

                    // Check if ball is outside the circular arc
                    if (distanceFromCorner + ball.radius > circleRadius) {
                        // Ball hit the circular boundary
                        const angle = Math.atan2(dy, dx);

                        // Calculate normal vector (pointing inward)
                        const normalX = Math.cos(angle);
                        const normalY = Math.sin(angle);

                        // Reflect velocity across the normal
                        const dotProduct = ball.vx * normalX + ball.vy * normalY;
                        ball.vx = ball.vx - 2 * dotProduct * normalX;
                        ball.vy = ball.vy - 2 * dotProduct * normalY;

                        // Push ball back inside the circle
                        const targetDistance = circleRadius - ball.radius - 2;
                        ball.x = containerSize + normalX * targetDistance;
                        ball.y = containerSize + normalY * targetDistance;
                    }

                    // Constrain to rectangular bounds (right and bottom walls)
                    if (ball.x > containerSize - ball.radius) {
                        ball.x = containerSize - ball.radius;
                        ball.vx = -Math.abs(ball.vx);
                    }

                    if (ball.y > containerSize - ball.radius) {
                        ball.y = containerSize - ball.radius;
                        ball.vy = -Math.abs(ball.vy);
                    }

                    // Top and left boundaries (open sides)
                    if (ball.x < ball.radius) {
                        ball.x = ball.radius;
                        ball.vx = Math.abs(ball.vx);
                    }

                    if (ball.y < ball.radius) {
                        ball.y = ball.radius;
                        ball.vy = Math.abs(ball.vy);
                    }
                });

                // Ball-to-ball collision
                for (let i = 0; i < newBalls.length; i++) {
                    for (let j = i + 1; j < newBalls.length; j++) {
                        const ball1 = newBalls[i];
                        const ball2 = newBalls[j];

                        const dx = ball2.x - ball1.x;
                        const dy = ball2.y - ball1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = ball1.radius + ball2.radius;

                        if (distance < minDistance && distance > 0) {
                            // Normalize direction
                            const nx = dx / distance;
                            const ny = dy / distance;

                            // Relative velocity
                            const dvx = ball2.vx - ball1.vx;
                            const dvy = ball2.vy - ball1.vy;

                            // Relative velocity in collision normal direction
                            const dvn = dvx * nx + dvy * ny;

                            // Do not resolve if velocities are separating
                            if (dvn < 0) {
                                // Apply impulse
                                ball1.vx += dvn * nx;
                                ball1.vy += dvn * ny;
                                ball2.vx -= dvn * nx;
                                ball2.vy -= dvn * ny;

                                // Separate balls
                                const overlap = minDistance - distance;
                                const separateX = (overlap / 2) * nx;
                                const separateY = (overlap / 2) * ny;

                                ball1.x -= separateX;
                                ball1.y -= separateY;
                                ball2.x += separateX;
                                ball2.y += separateY;
                            }
                        }
                    }
                }

                return newBalls;
            });
        };

        const interval = setInterval(animate, 1000 / 60);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute pointer-events-none"
            style={{
                width: containerSize,
                height: containerSize,
                bottom: 0,
                right: 0,
                overflow: 'hidden',
            }}
        >
            {balls.map((ball, index) => (
                <div
                    key={index}
                    className="absolute rounded-full bg-white shadow-lg"
                    style={{
                        width: ball.radius * 2,
                        height: ball.radius * 2,
                        left: ball.x - ball.radius,
                        top: ball.y - ball.radius,
                        transition: 'none',
                        opacity: 0.9,
                    }}
                />
            ))}
        </div>
    );
}

export default function RoleSelectionPage() {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const router = useRouter();
    const { user, loading } = useAuth();

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            console.log('No user found, redirecting to sign-in');
            router.push('/sign-in');
        }
    }, [user, loading, router]);

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(selectedRole === role ? null : role);
        setError(null);
    };

    const handleContinue = async () => {
        if (!selectedRole || !user) {
            setError('Please sign in to continue');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            console.log('Creating profile for user:', user.id, 'with role:', selectedRole);

            // Get the session token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            console.log('Session check:', {
                hasSession: !!session,
                hasAccessToken: !!session?.access_token,
                sessionError
            });

            if (!session || !session.access_token) {
                throw new Error('No active session. Please sign in again.');
            }

            console.log('Sending request with token:', session.access_token.substring(0, 20) + '...');

            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    authUserId: user.id,
                    role: selectedRole,
                }),
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                // Check if it's a duplicate key error (profile already exists)
                if (data.error && data.error.includes('duplicate key')) {
                    console.log('Profile already exists, redirecting to onboarding');
                    router.push(`/onboarding/${selectedRole}`);
                    return;
                }
                throw new Error(data.error || 'Failed to create profile');
            }

            // Redirect to onboarding
            console.log('Redirecting to:', `/onboarding/${selectedRole}`);
            router.push(`/onboarding/${selectedRole}`);
        } catch (err) {
            console.error('Profile creation error:', err);
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setIsSubmitting(false);
        }
    };

    const selectedCard = roleCards.find(card => card.role === selectedRole);
    const backgroundColor = selectedCard ? selectedCard.lightBg : '#F9FAFB';

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
                    <p className="text-gray-600 font-inter">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="min-h-screen flex flex-col p-4 transition-colors duration-500 relative overflow-hidden"
                style={{ backgroundColor }}
            >
                {/* Floating Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Bouncing Balls */}
                    <BouncingBalls />

                    {/* Large Circle 1 - Diagonal movement */}
                    <div
                        className="absolute w-96 h-96 rounded-full opacity-20 animate-float-diagonal transition-all duration-1000"
                        style={{
                            background: `radial-gradient(circle, ${selectedCard?.themeColor || '#FF6B35'} 0%, transparent 70%)`,
                            top: '10%',
                            left: '5%',
                            animationDelay: '0s',
                            filter: 'blur(40px)',
                        }}
                    />

                    {/* Large Circle 2 - Circular movement */}
                    <div
                        className="absolute w-[28rem] h-[28rem] rounded-full opacity-15 animate-float-circular transition-all duration-1000"
                        style={{
                            background: `radial-gradient(circle, ${selectedCard?.themeColor || '#4F46E5'} 0%, transparent 70%)`,
                            top: '50%',
                            right: '5%',
                            animationDelay: '2s',
                            filter: 'blur(50px)',
                        }}
                    />

                    {/* Large Circle 3 - Wave movement */}
                    <div
                        className="absolute w-80 h-80 rounded-full opacity-18 animate-float-wave transition-all duration-1000"
                        style={{
                            background: `radial-gradient(circle, ${selectedCard?.themeColor || '#10B981'} 0%, transparent 70%)`,
                            bottom: '10%',
                            left: '20%',
                            animationDelay: '4s',
                            filter: 'blur(45px)',
                        }}
                    />

                    {/* Half-Circle Container - Bottom Right */}
                    <div
                        className="absolute w-[32rem] h-[32rem] rounded-full overflow-hidden"
                        style={{
                            bottom: '-16rem',
                            right: '-16rem',
                            border: `4px solid ${selectedCard?.themeColor || '#9CA3AF'}`,
                            backgroundColor: selectedCard?.themeColor || '#E5E7EB',
                            opacity: 0.25,
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                        }}
                    />
                </div>

                {/* Header with Logo and Help */}
                <div className="w-full max-w-7xl mx-auto flex justify-between items-center py-6 relative z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-[#FF6B35]" />
                        <span className="text-2xl font-outfit font-bold text-gray-900">
                            SabiLearn
                        </span>
                    </div>

                    {/* Need Help Button */}
                    <button
                        onClick={() => setShowHelpModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 font-inter"
                    >
                        <HelpCircle className="w-5 h-5" />
                        <span>Need help?</span>
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className="w-full max-w-7xl">
                        {/* Header */}
                        <div className="text-center mb-20">
                            <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 mb-4">
                                Choose Your Role
                            </h1>
                            <p className="text-lg text-gray-600 font-inter">
                                Select how you'd like to use SabiLearn to customize your experience.
                            </p>
                        </div>

                        {/* Role Cards */}
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            {roleCards.map((card) => {
                                const Icon = card.icon;
                                const isSelected = selectedRole === card.role;

                                return (
                                    <button
                                        key={card.role}
                                        onClick={() => handleRoleSelect(card.role)}
                                        disabled={isSubmitting}
                                        className={`
                    relative p-10 rounded-xl border-2 transition-all duration-300 text-left
                    ${isSelected
                                                ? 'shadow-2xl scale-105'
                                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-102'
                                            }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                                        style={{
                                            backgroundColor: isSelected ? card.darkBg : 'white',
                                            borderColor: isSelected ? card.themeColor : undefined,
                                        }}
                                    >
                                        {/* Radio Button Indicator */}
                                        <div className="absolute top-4 right-4">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300`}
                                                style={{
                                                    borderColor: isSelected ? card.themeColor : '#D1D5DB',
                                                    backgroundColor: isSelected ? card.themeColor : 'transparent',
                                                }}
                                            >
                                                {isSelected && (
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Icon */}
                                        <div
                                            className="mb-6 transition-colors duration-300"
                                            style={{ color: isSelected ? card.themeColor : '#9CA3AF' }}
                                        >
                                            <Icon className="w-16 h-16" />
                                        </div>

                                        {/* Title */}
                                        <h3
                                            className="text-2xl font-outfit font-bold mb-3 transition-colors duration-300"
                                            style={{ color: isSelected ? card.themeColor : '#111827' }}
                                        >
                                            {card.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="font-inter text-gray-600 text-sm leading-relaxed">
                                            {card.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 font-inter text-center text-sm">{error}</p>
                            </div>
                        )}

                        {/* Continue Button or Prompt */}
                        <div className="flex justify-center min-h-[52px] items-center">
                            {!selectedRole ? (
                                <p className="text-gray-500 font-inter text-base">
                                    Please select a role to continue
                                </p>
                            ) : (
                                <button
                                    onClick={handleContinue}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 rounded-lg font-inter font-medium text-base transition-all duration-300 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                                    style={{
                                        backgroundColor: selectedCard?.themeColor,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSubmitting && selectedCard) {
                                            e.currentTarget.style.filter = 'brightness(0.9)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = 'brightness(1)';
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Creating Profile...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Help Modal */}
            {showHelpModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-outfit font-bold text-gray-900">
                                Choose the Right Role
                            </h2>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Tutor Section */}
                            <div className="border-l-4 border-[#FF6B35] pl-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Presentation className="w-8 h-8 text-[#FF6B35]" />
                                    <h3 className="text-xl font-outfit font-bold text-gray-900">
                                        Tutor
                                    </h3>
                                </div>
                                <p className="text-gray-700 font-inter mb-3">
                                    Perfect for educators, subject experts, and professionals who want to share their knowledge and earn income.
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm font-inter text-gray-600">
                                        <span className="font-semibold">What you'll do:</span>
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 font-inter ml-2">
                                        <li>Create your professional tutor profile</li>
                                        <li>Set your own hourly rates and availability</li>
                                        <li>Connect with students seeking your expertise</li>
                                        <li>Teach online or offer home tutoring</li>
                                        <li>Receive payments securely through the platform</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Student Section */}
                            <div className="border-l-4 border-[#4F46E5] pl-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <GraduationCap className="w-8 h-8 text-[#4F46E5]" />
                                    <h3 className="text-xl font-outfit font-bold text-gray-900">
                                        Student
                                    </h3>
                                </div>
                                <p className="text-gray-700 font-inter mb-3">
                                    Ideal for learners of all ages who want personalized tutoring to excel in their studies.
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm font-inter text-gray-600">
                                        <span className="font-semibold">What you'll do:</span>
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 font-inter ml-2">
                                        <li>Browse verified tutors by subject and expertise</li>
                                        <li>View tutor profiles, ratings, and reviews</li>
                                        <li>Book sessions that fit your schedule</li>
                                        <li>Choose between online or in-person tutoring</li>
                                        <li>Track your learning progress and goals</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Parent Section */}
                            <div className="border-l-4 border-[#10B981] pl-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Users className="w-8 h-8 text-[#10B981]" />
                                    <h3 className="text-xl font-outfit font-bold text-gray-900">
                                        Parent
                                    </h3>
                                </div>
                                <p className="text-gray-700 font-inter mb-3">
                                    Best for parents and guardians looking to find qualified tutors for their children's education.
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm font-inter text-gray-600">
                                        <span className="font-semibold">What you'll do:</span>
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 font-inter ml-2">
                                        <li>Find trusted tutors for your child's needs</li>
                                        <li>Manage your child's tutoring schedule</li>
                                        <li>Monitor progress and session history</li>
                                        <li>Communicate directly with tutors</li>
                                        <li>Handle payments and bookings in one place</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="bg-gray-50 rounded-lg p-4 mt-6">
                                <p className="text-sm text-gray-600 font-inter">
                                    <span className="font-semibold">Note:</span> You can only select one role per account. Choose carefully based on how you plan to use SabiLearn. Once you complete the onboarding process, your role cannot be changed.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-inter font-medium hover:bg-gray-800 transition-colors"
                            >
                                Got it, thanks!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
