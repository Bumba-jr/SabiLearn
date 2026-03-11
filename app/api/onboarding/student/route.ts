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

        console.log('📝 Student onboarding submission received for user:', userId);

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

        // Get profile photo URL from Supabase Storage if it exists
        let avatarUrl = null;
        if (body.profilePhotoUrl) {
            avatarUrl = body.profilePhotoUrl;
        } else {
            // Try to get from storage using user ID
            const { data: storageFiles } = await supabaseAdmin
                .storage
                .from('avatars')
                .list(userId);

            if (storageFiles && storageFiles.length > 0) {
                // Get the most recent file
                const latestFile = storageFiles.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];

                const { data: publicUrlData } = supabaseAdmin
                    .storage
                    .from('avatars')
                    .getPublicUrl(`${userId}/${latestFile.name}`);

                avatarUrl = publicUrlData.publicUrl;
            }
        }

        console.log('📸 Avatar URL:', avatarUrl || 'No avatar found');

        // Update the profile to mark onboarding as complete AND set the role
        console.log('📝 Updating profile...');
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'student', // Set role when onboarding is completed
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

        // Create or update the student record
        console.log('📝 Upserting student record...');

        const studentData = {
            auth_user_id: userId, // Supabase Auth user ID (UUID)
            user_id: userId.toString(), // Convert UUID to string for TEXT column
            name: `${body.firstName} ${body.lastName}`,
            email: body.email || user.email,
            phone: body.phone,
            bio: body.bio,
            subjects: body.subjects || [],
            grade_levels: body.gradeLevels || [],
            exam_types: body.examTypes || [],
            location: `${body.lga}, ${body.state}`,
            avatar_url: avatarUrl,
            date_of_birth: body.dateOfBirth,
            gender: body.gender,
            updated_at: new Date().toISOString(),
        };

        console.log('📦 Student data to upsert:', JSON.stringify(studentData, null, 2));

        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .upsert(studentData, {
                onConflict: 'auth_user_id'
            })
            .select()
            .single();

        if (studentError) {
            console.error('❌ Student upsert error:', studentError);
            console.error('❌ Error code:', studentError.code);
            console.error('❌ Error message:', studentError.message);
            console.error('❌ Error details:', studentError.details);
            console.error('❌ Error hint:', studentError.hint);
            return NextResponse.json(
                {
                    error: 'Failed to create student profile',
                    details: studentError.message,
                    code: studentError.code,
                    hint: studentError.hint
                },
                { status: 500 }
            );
        }

        console.log('✅ Student record created/updated successfully');

        return NextResponse.json(
            {
                message: 'Onboarding completed successfully',
                student,
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
