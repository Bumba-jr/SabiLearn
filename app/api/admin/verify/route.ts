import { NextResponse } from 'next/server';
import { getServerUser, isAdmin } from '@/lib/auth/supabase-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
    try {
        const user = await getServerUser();

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, role, verified } = body;

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Update verification status based on role
        let updateResult;
        if (role === 'tutor') {
            updateResult = await supabaseAdmin
                .from('tutors')
                .update({ is_verified: verified })
                .eq('auth_user_id', userId);
        } else if (role === 'student') {
            updateResult = await supabaseAdmin
                .from('students')
                .update({ is_verified: verified })
                .eq('auth_user_id', userId);
        } else {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        if (updateResult.error) {
            console.error('Error updating verification:', updateResult.error);
            return NextResponse.json(
                { error: 'Failed to update verification status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `User ${verified ? 'verified' : 'unverified'} successfully`,
        });
    } catch (error) {
        console.error('Error in verify API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
