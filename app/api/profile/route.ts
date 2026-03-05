import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { clerkUserId, role } = body;

        // Verify user owns this profile
        if (userId !== clerkUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Validate role
        if (!['tutor', 'student', 'parent'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check for existing profile
        const { data: existing } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (existing) {
            // If profile exists and onboarding not complete, allow role update
            if (!existing.onboarding_completed) {
                const { data: updated, error: updateError } = await supabase
                    .from('profiles')
                    .update({ role, updated_at: new Date().toISOString() })
                    .eq('clerk_user_id', clerkUserId)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Update error:', updateError);
                    return NextResponse.json({ error: updateError.message }, { status: 500 });
                }

                // Clear any existing onboarding progress when role changes
                await supabase
                    .from('onboarding_progress')
                    .delete()
                    .eq('clerk_user_id', clerkUserId);

                return NextResponse.json(updated);
            }

            // Profile exists and onboarding complete
            return NextResponse.json(existing);
        }

        // Create new profile
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
                clerk_user_id: clerkUserId,
                role,
                onboarding_completed: false,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json(newProfile);
    } catch (error) {
        console.error('Profile creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No profile found
                return NextResponse.json({ profile: null });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
