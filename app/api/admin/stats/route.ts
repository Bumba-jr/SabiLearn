import { NextResponse } from 'next/server';
import { getServerUser, isAdmin } from '@/lib/auth/supabase-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
    try {
        const user = await getServerUser();

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get total users
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Get total tutors
        const { count: totalTutors } = await supabaseAdmin
            .from('tutors')
            .select('*', { count: 'exact', head: true });

        // Get verified tutors
        const { count: verifiedTutors } = await supabaseAdmin
            .from('tutors')
            .select('*', { count: 'exact', head: true })
            .eq('is_verified', true);

        // Get total students
        const { count: totalStudents } = await supabaseAdmin
            .from('students')
            .select('*', { count: 'exact', head: true });

        // Get pending verifications
        const { count: pendingVerifications } = await supabaseAdmin
            .from('tutors')
            .select('*', { count: 'exact', head: true })
            .eq('is_verified', false);

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers || 0,
                totalTutors: totalTutors || 0,
                verifiedTutors: verifiedTutors || 0,
                totalStudents: totalStudents || 0,
                pendingVerifications: pendingVerifications || 0,
            },
        });
    } catch (error) {
        console.error('Error in stats API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
