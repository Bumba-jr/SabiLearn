import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side auth utilities
export async function getServerSession() {
    const cookieStore = await cookies();

    // Debug: Log all cookies
    const allCookies = cookieStore.getAll();
    console.log('🍪 All cookies:', allCookies.map(c => c.name));

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    const value = cookieStore.get(name)?.value;
                    console.log(`🍪 Getting cookie ${name}:`, value ? 'found' : 'not found');
                    return value;
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle cookie setting errors in server components
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle cookie removal errors in server components
                    }
                },
            },
        }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('❌ Error getting session:', error);
        return null;
    }

    console.log('✅ Session found:', session ? `User: ${session.user.id}` : 'No session');
    return session;
}

export async function getServerUser() {
    const session = await getServerSession();
    return session?.user ?? null;
}

export async function getUserProfile(userId: string) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}

// Auth helper for API routes
export async function requireAuth() {
    const user = await getServerUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    return user;
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
    const adminUserId = process.env.ADMIN_USER_ID;
    return userId === adminUserId;
}
