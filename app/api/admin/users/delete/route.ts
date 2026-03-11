import { NextResponse } from 'next/server';
import { getServerUser, isAdmin } from '@/lib/auth/supabase-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function DELETE(request: Request) {
    try {
        const user = await getServerUser();

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { authUserId, clerkUserId, profileId, role } = await request.json();

        if (!role) {
            return NextResponse.json(
                { error: 'Missing role field' },
                { status: 400 }
            );
        }

        console.log('Delete request:', { authUserId, clerkUserId, profileId, role });

        // Delete from role-specific table first (due to foreign key constraints)
        if (role === 'tutor') {
            // Try deleting by auth_user_id first, then clerk_user_id, then user_id
            if (authUserId) {
                const { error: tutorError } = await supabaseAdmin
                    .from('tutors')
                    .delete()
                    .eq('auth_user_id', authUserId);
                if (tutorError) console.error('Error deleting tutor by auth_user_id:', tutorError);
            }

            if (clerkUserId) {
                const { error: tutorError } = await supabaseAdmin
                    .from('tutors')
                    .delete()
                    .eq('clerk_user_id', clerkUserId);
                if (tutorError) console.error('Error deleting tutor by clerk_user_id:', tutorError);
            }

            // Also try by user_id (old TEXT field)
            if (clerkUserId) {
                const { error: tutorError } = await supabaseAdmin
                    .from('tutors')
                    .delete()
                    .eq('user_id', clerkUserId);
                if (tutorError) console.error('Error deleting tutor by user_id:', tutorError);
            }
        } else if (role === 'student') {
            if (authUserId) {
                const { error: studentError } = await supabaseAdmin
                    .from('students')
                    .delete()
                    .eq('auth_user_id', authUserId);
                if (studentError) console.error('Error deleting student by auth_user_id:', studentError);
            }

            if (clerkUserId) {
                const { error: studentError } = await supabaseAdmin
                    .from('students')
                    .delete()
                    .eq('clerk_user_id', clerkUserId);
                if (studentError) console.error('Error deleting student by clerk_user_id:', studentError);
            }

            if (clerkUserId) {
                const { error: studentError } = await supabaseAdmin
                    .from('students')
                    .delete()
                    .eq('user_id', clerkUserId);
                if (studentError) console.error('Error deleting student by user_id:', studentError);
            }
        }

        // Delete from profiles table
        let profileDeleted = false;

        if (authUserId) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('auth_user_id', authUserId);
            if (!profileError) profileDeleted = true;
            else console.error('Error deleting profile by auth_user_id:', profileError);
        }

        if (!profileDeleted && clerkUserId) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('clerk_user_id', clerkUserId);
            if (!profileError) profileDeleted = true;
            else console.error('Error deleting profile by clerk_user_id:', profileError);
        }

        if (!profileDeleted && profileId) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', profileId);
            if (!profileError) profileDeleted = true;
            else console.error('Error deleting profile by id:', profileError);
        }

        if (!profileDeleted) {
            return NextResponse.json(
                { error: 'Failed to delete user profile' },
                { status: 500 }
            );
        }

        // Delete from auth.users if authUserId exists
        if (authUserId) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
                authUserId
            );

            if (authError) {
                console.error('Error deleting auth user:', authError);
                // Don't fail the request if auth deletion fails (user might not exist in auth)
            }
        }

        return NextResponse.json(
            { message: 'User deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in delete user API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
