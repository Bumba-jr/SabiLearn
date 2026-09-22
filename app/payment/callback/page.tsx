'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');
    const [state, setState] = useState<'verifying' | 'paid' | 'failed'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!reference) {
            setState('failed');
            setMessage('No payment reference was provided.');
            return;
        }

        const verify = async () => {
            try {
                const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
                const data = await response.json();
                if (response.ok && data.status === 'paid') {
                    setState('paid');
                } else {
                    setState('failed');
                    setMessage(data.reason || data.error || 'We could not confirm this payment.');
                }
            } catch {
                setState('failed');
                setMessage('Could not reach the payment service. If you were debited, the booking will update shortly.');
            }
        };

        verify();
    }, [reference]);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
            <Header />
            <main className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 max-w-md w-full text-center">
                    {state === 'verifying' && (
                        <>
                            <Loader2 className="w-14 h-14 animate-spin text-green-600 mx-auto mb-4" />
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Confirming your payment…</h1>
                            <p className="text-gray-500 text-sm">This only takes a moment.</p>
                        </>
                    )}
                    {state === 'paid' && (
                        <>
                            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment successful!</h1>
                            <p className="text-gray-500 text-sm mb-6">
                                Your lesson is booked and paid for. You can track it from your dashboard.
                            </p>
                            <Link
                                href="/dashboard"
                                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold text-sm"
                            >
                                Go to Dashboard
                            </Link>
                        </>
                    )}
                    {state === 'failed' && (
                        <>
                            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment not confirmed</h1>
                            <p className="text-gray-500 text-sm mb-6">{message}</p>
                            <Link
                                href="/dashboard"
                                className="inline-block bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm"
                            >
                                Back to Dashboard
                            </Link>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
