'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function TestSessionPage() {
    const { user, session } = useAuth();
    const [sessionData, setSessionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            setSessionData({ data, error });
            setLoading(false);
        };
        checkSession();
    }, []);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Session Debug Info</h1>

            <div className="space-y-6">
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-bold mb-2">From AuthProvider:</h2>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify({
                            hasUser: !!user,
                            userId: user?.id,
                            userEmail: user?.email,
                            hasSession: !!session,
                            hasAccessToken: !!session?.access_token
                        }, null, 2)}
                    </pre>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-bold mb-2">From getSession():</h2>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify({
                            hasSession: !!sessionData?.data?.session,
                            hasAccessToken: !!sessionData?.data?.session?.access_token,
                            userId: sessionData?.data?.session?.user?.id,
                            userEmail: sessionData?.data?.session?.user?.email,
                            error: sessionData?.error
                        }, null, 2)}
                    </pre>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-bold mb-2">Access Token (first 50 chars):</h2>
                    <pre className="text-xs overflow-auto">
                        {sessionData?.data?.session?.access_token?.substring(0, 50) || 'No token'}
                    </pre>
                </div>
            </div>
        </div>
    );
}
