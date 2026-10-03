'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Users, CheckCircle2, Shield } from 'lucide-react';

const GRADE_OPTIONS = ['Primary 1-3', 'Primary 4-6', 'JSS 1-3', 'SSS 1-3'];

interface ChildDraft {
    name: string;
    gradeLevel: string;
    createLogin: boolean;
    email: string;
    password: string;
}

export default function ParentOnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [profileState, setProfileState] = useState<'loading' | 'ok' | 'already-parent' | 'other-role'>('loading');
    const [existingRole, setExistingRole] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2>(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [children, setChildren] = useState<ChildDraft[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If this account already finished onboarding, say so instead of a dead end
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await fetch('/api/dashboard');
                if (!res.ok) { setProfileState('ok'); return; }
                const data = await res.json();
                if (data.role === 'parent' && data.onboardingCompleted) {
                    setProfileState('already-parent');
                } else if (data.onboardingCompleted && data.role) {
                    setExistingRole(data.role);
                    setProfileState('other-role');
                } else {
                    setProfileState('ok');
                }
            } catch {
                setProfileState('ok');
            }
        })();
    }, [user]);

    const addChild = () => setChildren((prev) => [...prev, { name: '', gradeLevel: GRADE_OPTIONS[1], createLogin: true, email: '', password: '' }]);
    const removeChild = (i: number) => setChildren((prev) => prev.filter((_, j) => j !== i));
    const updateChild = (i: number, patch: Partial<ChildDraft>) =>
        setChildren((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));

    const finish = async () => {
        if (!user) {
            router.push('/sign-in');
            return;
        }
        const filled = children.filter((c) => c.name.trim());
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/onboarding/parent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    children: filled.map((c) => ({
                        name: c.name,
                        gradeLevel: c.gradeLevel,
                        email: c.createLogin ? c.email : undefined,
                        password: c.createLogin ? c.password : undefined,
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Could not complete onboarding.');
                return;
            }
            toast.success('Welcome to SabiLearn! Your parent account is ready.');
            router.push('/dashboard/parent');
        } catch {
            setError('Could not reach the server. Check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <Header />
            <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
                {profileState === 'loading' && (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                )}
                {profileState === 'already-parent' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center max-w-md mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h1 className="text-xl font-bold text-gray-900 mb-2">You're all set!</h1>
                        <p className="text-sm text-gray-500 mb-6">This account is already onboarded as a parent.</p>
                        <button onClick={() => router.push('/dashboard/parent')} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl">
                            Go to Parent Dashboard
                        </button>
                    </div>
                )}
                {profileState === 'other-role' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center max-w-md mx-auto">
                        <Shield className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Different account needed</h1>
                        <p className="text-sm text-gray-500 mb-6">
                            This account already completed onboarding as a <span className="font-semibold capitalize">{existingRole}</span>. Parent accounts need their own sign-up.
                        </p>
                        <button onClick={() => router.push('/dashboard')} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl">
                            Go to My Dashboard
                        </button>
                    </div>
                )}
                {profileState === 'ok' && (<>
                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-200'}`} />
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
                </div>

                {step === 1 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome, Parent</h1>
                        <p className="text-sm text-gray-500 mb-6">Tell us a bit about you so tutors know who they're working with.</p>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="e.g. Grace"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="e.g. Adeyemi"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                placeholder="08012345678"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                            />
                        </div>

                        <button
                            onClick={() => {
                                if (!firstName.trim() || !lastName.trim()) {
                                    toast.error('Please enter your first and last name.');
                                    return;
                                }
                                setStep(2);
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Add your children</h1>
                        <p className="text-sm text-gray-500 mb-6">We'll keep their lessons organized under your account. You can add more later.</p>

                        <div className="space-y-4 mb-4">
                            {children.map((child, i) => (
                                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <input
                                            value={child.name}
                                            onChange={(e) => updateChild(i, { name: e.target.value })}
                                            placeholder={`Child ${i + 1} full name`}
                                            className="flex-1 min-w-[180px] px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                                        />
                                        <select
                                            value={child.gradeLevel}
                                            onChange={(e) => updateChild(i, { gradeLevel: e.target.value })}
                                            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                                        >
                                            {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <button onClick={() => removeChild(i)} className="text-red-400 hover:text-red-600 p-2" aria-label="Remove child">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={child.createLogin}
                                            onChange={(e) => updateChild(i, { createLogin: e.target.checked })}
                                            className="w-4 h-4 accent-green-600"
                                        />
                                        Create a login so {child.name ? child.name : 'this child'} can sign in and see their own dashboard
                                    </label>
                                    {child.createLogin && (
                                        <div className="flex flex-wrap gap-3">
                                            <input
                                                type="email"
                                                value={child.email}
                                                onChange={(e) => updateChild(i, { email: e.target.value })}
                                                placeholder="Child's email (for logging in)"
                                                className="flex-1 min-w-[180px] px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                                            />
                                            <input
                                                type="password"
                                                value={child.password}
                                                onChange={(e) => updateChild(i, { password: e.target.value })}
                                                placeholder="Password (min 6 characters)"
                                                className="flex-1 min-w-[160px] px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addChild}
                            className="text-green-700 font-semibold text-sm flex items-center gap-1.5 mb-8 hover:underline"
                        >
                            <Plus className="w-4 h-4" /> Add another child
                        </button>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
                            >
                                Back
                            </button>
                            <button
                                onClick={finish}
                                disabled={submitting}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                Finish Setup
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-3">
                            You can skip adding children now and add them from your dashboard.
                        </p>
                    </div>
                )}
            </>)}
            </main>
            <Footer />
        </div>
    );
}
