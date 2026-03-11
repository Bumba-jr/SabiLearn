import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getServerUser } from '@/lib/auth/supabase-auth';

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user.id;
        const body = await request.json();

        console.log('📝 Onboarding submission received for user:', userId);

        // First, get the profile to get the profile ID (UUID)
        console.log('📝 Fetching profile...');
        const { data: profile, error: profileFetchError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('auth_user_id', userId)
            .single();

        if (profileFetchError || !profile) {
            console.error('❌ Profile fetch error:', profileFetchError);
            return NextResponse.json(
                { error: 'Profile not found', details: profileFetchError?.message },
                { status: 404 }
            );
        }

        console.log('✅ Profile found, ID:', profile.id);

        // Get profile photo URL from request body (should come from draft storage)
        let avatarUrl = body.profilePhotoUrl || null;

        console.log('📸 Avatar URL from request:', avatarUrl || 'No avatar provided');

        // Get intro video URL from request body (should come from draft storage)
        let introVideoUrl = body.introVideoUrl || null;

        console.log('🎥 Intro Video URL from request:', introVideoUrl || 'No video provided');

        // Get document URLs from request body (should come from draft storage)
        let degreeCertificateUrl = body.degreeCertificateUrl || null;
        let governmentIdUrl = body.governmentIdUrl || null;
        let nyscCertificateUrl = body.nyscCertificateUrl || null;

        console.log('📄 Degree Certificate URL:', degreeCertificateUrl || 'No document provided');
        console.log('🪪 Government ID URL:', governmentIdUrl || 'No document provided');
        console.log('📜 NYSC Certificate URL:', nyscCertificateUrl || 'No document provided');

        // Update the profile to mark onboarding as complete AND set the role
        console.log('📝 Updating profile...');
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'tutor', // Set role when onboarding is completed
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', userId);

        if (profileError) {
            console.error('❌ Profile update error:', profileError);
            return NextResponse.json(
                { error: 'Failed to update profile', details: profileError.message },
                { status: 500 }
            );
        }

        console.log('✅ Profile updated successfully');

        // Then, create or update the tutor record with the auth_user_id
        console.log('📝 Upserting tutor record...');

        const tutorData = {
            auth_user_id: userId, // Supabase Auth user ID (UUID)
            user_id: userId.toString(), // Convert UUID to string for TEXT column
            name: `${body.firstName} ${body.lastName}`,
            email: body.email,
            phone: body.phone,
            bio: body.bio,
            subjects: body.subjects || [],
            grade_levels: body.gradeLevels || [],
            hourly_rate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
            location: `${body.lga}, ${body.state}`,
            avatar_url: avatarUrl, // Add avatar URL
            intro_video_url: introVideoUrl, // Add intro video URL
            degree_certificate_url: degreeCertificateUrl, // Add degree certificate URL
            government_id_url: governmentIdUrl, // Add government ID URL
            nysc_certificate_url: nyscCertificateUrl, // Add NYSC certificate URL
            experience_level: body.experienceLevel || 'intermediate', // Add experience level
            experiences: body.experiences || [], // Add experiences as JSONB
            bank_name: body.bankName,
            account_number: body.accountNumber,
            account_name: body.accountName,
            updated_at: new Date().toISOString(),
        };

        console.log('📦 Tutor data to upsert:', JSON.stringify(tutorData, null, 2));

        const { data: tutor, error: tutorError } = await supabaseAdmin
            .from('tutors')
            .upsert(tutorData, {
                onConflict: 'auth_user_id'
            })
            .select()
            .single();

        if (tutorError) {
            console.error('❌ Tutor upsert error:', tutorError);
            console.error('❌ Error code:', tutorError.code);
            console.error('❌ Error message:', tutorError.message);
            console.error('❌ Error details:', tutorError.details);
            console.error('❌ Error hint:', tutorError.hint);
            console.error('❌ Full error:', JSON.stringify(tutorError, null, 2));
            return NextResponse.json(
                {
                    error: 'Failed to create tutor profile',
                    details: tutorError.message,
                    code: tutorError.code,
                    hint: tutorError.hint
                },
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
