import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { clerkUserId, ...formData } = body;

        console.log('📝 Onboarding submission received for user:', clerkUserId);

        // Verify user ID matches
        if (clerkUserId !== userId) {
            return NextResponse.json(
                { error: 'Forbidden: User ID mismatch' },
                { status: 403 }
            );
        }

        // First, get the profile to get the user_id (UUID)
        console.log('📝 Fetching profile...');
        const { data: profile, error: profileFetchError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (profileFetchError || !profile) {
            console.error('❌ Profile fetch error:', profileFetchError);
            return NextResponse.json(
                { error: 'Profile not found', details: profileFetchError?.message },
                { status: 404 }
            );
        }

        console.log('✅ Profile found, ID:', profile.id);

        // Update the profile to mark onboarding as complete
        console.log('📝 Updating profile...');
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            })
            .eq('clerk_user_id', clerkUserId);

        if (profileError) {
            console.error('❌ Profile update error:', profileError);
            return NextResponse.json(
                { error: 'Failed to update profile', details: profileError.message },
                { status: 500 }
            );
        }

        console.log('✅ Profile updated successfully');

        // Then, create or update the tutor record with the user_id
        console.log('📝 Upserting tutor record...');
        const { data: tutor, error: tutorError } = await supabaseAdmin
            .from('tutors')
            .upsert({
                user_id: profile.id, // This is the UUID from profiles table
                clerk_user_id: clerkUserId,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                bio: formData.bio,
                subjects: formData.subjects || [],
                grade_levels: formData.gradeLevels || [],
                hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
                location: `${formData.lga}, ${formData.state}`,
                bank_name: formData.bankName,
                account_number: formData.accountNumber,
                account_name: formData.accountName,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'clerk_user_id'
            })
            .select()
            .single();

        if (tutorError) {
            console.error('❌ Tutor upsert error:', tutorError);
            console.error('Error details:', JSON.stringify(tutorError, null, 2));
            return NextResponse.json(
                { error: 'Failed to create tutor profile', details: tutorError.message },
                { status: 500 }
            );
        }

        console.log('✅ Tutor record created/updated successfully');

        return NextResponse.json(
            {
                message: 'Onboarding completed successfully',
                tutor,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Onboarding error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
