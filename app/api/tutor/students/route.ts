import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { /* middleware refreshes the session */ },
            },
        }
    );
    const { data: { user } } = await supabaseSSR.auth.getUser();
    return user;
}

// GET /api/tutor/students — distinct students the signed-in tutor has taught
// (or has bookings with), for the instant-class picker.
export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: tutorRow } = await supabase
            .from('tutors')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
        if (!tutorRow) {
            return NextResponse.json({ students: [] });
        }

        const { data: sessions } = await supabase
            .from('sessions')
            .select('student_id, student:students(id, name, avatar_url)')
            .eq('tutor_id', tutorRow.id)
            .limit(200);

        const seen = new Set<string>();
        const students: any[] = [];
        for (const s of sessions || []) {
            const student = Array.isArray(s.student) ? s.student[0] : s.student;
            if (!student || seen.has(student.id)) continue;
            seen.add(student.id);
            students.push(student);
        }

        return NextResponse.json({ students });
    } catch (error) {
        console.error('Tutor students API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
