"use client";

import { createContext, useContext, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type SupabaseContext = {
    supabase: SupabaseClient | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [supabase] = useState(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Return null if environment variables are not set
        if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url') {
            console.warn('Supabase environment variables not configured. Please update .env.local');
            return null;
        }

        return createClient(supabaseUrl, supabaseAnonKey);
    });

    return (
        <Context.Provider value={{ supabase }}>
            {children}
        </Context.Provider>
    );
}

export const useSupabase = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useSupabase must be used inside SupabaseProvider');
    }
    if (!context.supabase) {
        console.warn('Supabase client not initialized. Please configure your environment variables.');
    }
    return context;
};
