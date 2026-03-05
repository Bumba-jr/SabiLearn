import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/tutor(.*)', // Public tutor profile pages
    '/api/webhooks(.*)', // Webhook endpoints
]);

// Helper function to get user profile from Supabase
async function getProfile(clerkUserId: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error) return null;
    return data;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Allow public routes without any checks
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Allow API routes to handle their own authentication
    // IMPORTANT: Pass through without any processing to avoid body consumption
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    const { userId } = await auth();

    // Not authenticated - redirect to sign-in
    if (!userId) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
    }

    // Authenticated - check profile status
    try {
        const profile = await getProfile(userId);

        // No profile - redirect to role selection
        if (!profile) {
            if (!req.nextUrl.pathname.startsWith('/role-selection')) {
                return NextResponse.redirect(new URL('/role-selection', req.url));
            }
            return NextResponse.next();
        }

        // Profile exists but onboarding incomplete
        if (!profile.onboarding_completed) {
            const onboardingPath = `/onboarding/${profile.role}`;

            // Allow access to role selection if onboarding not complete
            if (req.nextUrl.pathname.startsWith('/role-selection')) {
                return NextResponse.next();
            }

            // Redirect to appropriate onboarding if not already there
            if (!req.nextUrl.pathname.startsWith(onboardingPath)) {
                return NextResponse.redirect(new URL(onboardingPath, req.url));
            }
            return NextResponse.next();
        }

        // Onboarding complete - enforce role-based routing
        const dashboardPath = `/dashboard/${profile.role}`;

        // Prevent access to wrong dashboard
        if (req.nextUrl.pathname.startsWith('/dashboard/')) {
            if (!req.nextUrl.pathname.startsWith(dashboardPath)) {
                return NextResponse.redirect(new URL(dashboardPath, req.url));
            }
        }

        // Prevent access to role selection or onboarding after completion
        if (
            req.nextUrl.pathname.startsWith('/role-selection') ||
            req.nextUrl.pathname.startsWith('/onboarding/')
        ) {
            return NextResponse.redirect(new URL(dashboardPath, req.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware error:', error);
        // On error, allow the request to proceed
        return NextResponse.next();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
