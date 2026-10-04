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

const SESSION_SELECT = `
    id, student_id, subject, scheduled_at, duration_minutes, status, location_type,
    location_address, amount, payment_status, notes, created_at,
    tutor:tutors(id, name, avatar_url, hourly_rate),
    student:students(id, name, email)
`;

// GET /api/dashboard — everything the tutor/student/parent dashboards need, in one call
export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        const role = profile?.role || null;
        const now = new Date().toISOString();

        // ---- Tutor context ----
        let tutor = null;
        let incoming: unknown[] = [];
        let upcoming: unknown[] = [];
        let past: unknown[] = [];
        let earningsTotal = 0;
        let completedCount = 0;

        if (role === 'tutor') {
            const { data: tutorRow } = await supabase
                .from('tutors')
                .select('id, name, avatar_url, rating, total_reviews, hourly_rate, is_verified, is_available, availability, subjects, grade_levels, location')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            tutor = tutorRow;

            if (tutorRow) {
                const { data: sessions } = await supabase
                    .from('sessions')
                    .select(SESSION_SELECT)
                    .eq('tutor_id', tutorRow.id)
                    .order('scheduled_at', { ascending: false })
                    .limit(100);

                const all = sessions || [];
                incoming = all.filter((s: any) => s.status === 'pending').reverse();
                upcoming = all
                    .filter((s: any) => s.status === 'accepted' && new Date(s.scheduled_at) >= new Date(now))
                    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
                past = all.filter((s: any) => ['completed', 'declined', 'cancelled'].includes(s.status)
                    || (s.status === 'accepted' && new Date(s.scheduled_at) < new Date(now)));
                completedCount = all.filter((s: any) => s.status === 'completed').length;
                earningsTotal = all
                    .filter((s: any) => s.payment_status === 'paid')
                    .reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
            }
        }

        // ---- Student context ----
        let student = null;
        let myBookings: unknown[] = [];
        let recentFeedback: unknown[] = [];

        if (role === 'student' || role === 'parent') {
            const { data: studentRow } = await supabase
                .from('students')
                .select('id, name, email, grade_level, child_code, parent_id, subjects, grade_levels')
                .eq('user_id', user.id)
                .maybeSingle();

            // Safeguard: accounts created during onboarding that already carry
            // real data shouldn't be forced through onboarding again.
            const hasRealData = !!studentRow && (
                (Array.isArray(studentRow.subjects) && studentRow.subjects.length > 0) ||
                (Array.isArray(studentRow.grade_levels) && studentRow.grade_levels.length > 0) ||
                !!studentRow.parent_id
            );
            if (profile && profile.onboarding_completed === false && hasRealData) {
                await supabase
                    .from('profiles')
                    .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
                    .eq('auth_user_id', user.id);
                profile.onboarding_completed = true;
            }

            // Self-onboarded students may not have a code yet — issue one lazily
            let childCode = studentRow?.child_code || null;
            if (studentRow && !childCode) {
                const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
                let suffix = '';
                for (let i = 0; i < 6; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
                const code = `SB-${suffix}`;
                const { data: updated } = await supabase
                    .from('students')
                    .update({ child_code: code })
                    .eq('id', studentRow.id)
                    .select('child_code')
                    .single();
                childCode = updated?.child_code || code;
            }

            student = studentRow ? {
                ...studentRow,
                childCode,
                parentLinked: !!studentRow.parent_id,
            } : null;

            if (studentRow) {
                const { data: sessions } = await supabase
                    .from('sessions')
                    .select(SESSION_SELECT)
                    .eq('student_id', studentRow.id)
                    .order('scheduled_at', { ascending: false })
                    .limit(100);
                myBookings = sessions || [];
            }
        }

        // ---- Parent: linked children + per-child progress ----
        let children: unknown[] = [];
        if (role === 'parent') {
            const { data: profileRow } = await supabase
                .from('profiles')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            if (profileRow) {
                const { data: childRows } = await supabase
                    .from('students')
                        .select('id, name, email, grade_level, child_code, created_at')
                    .eq('parent_id', profileRow.id);
                const kids = childRows || [];
                let sessions: any[] = [];
                if (kids.length > 0) {
                    const ids = kids.map((c) => c.id);
                    const { data: rows } = await supabase
                        .from('sessions')
                        .select(SESSION_SELECT)
                        .in('student_id', ids)
                        .order('scheduled_at', { ascending: false })
                        .limit(200);
                    sessions = rows || [];
                    myBookings = sessions;
                }

                // Recent feedback notes tutors left on completed lessons
                if (kids.length > 0) {
                    const ids = kids.map((c) => c.id);
                    const { data: frows, error: ferr } = await supabase
                        .from('sessions')
                        .select('id, feedback, subject, created_at, student_id, student:students(id, name), tutor:tutors(id, name, avatar_url)')
                        .in('student_id', ids)
                        .not('feedback', 'is', null)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    if (!ferr) recentFeedback = frows || [];
                }

                const now = new Date();
                children = kids.map((child) => {
                    const mine = sessions.filter((s) => s.student_id === child.id);
                    const completed = mine.filter((s) => s.status === 'completed');
                    const upcoming = mine
                        .filter((s) => s.status === 'accepted' && new Date(s.scheduled_at) >= now)
                        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
                    const pending = mine.filter((s) => s.status === 'pending');
                    const declined = mine.filter((s) => s.status === 'declined');
                    const cancelled = mine.filter((s) => s.status === 'cancelled');
                    const minutesLearned = completed.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                    const tutorsSet = new Set(mine.map((s) => s.tutor?.name).filter(Boolean));
                    return {
                        ...child,
                        progress: {
                            totalLessons: mine.length,
                            completed: completed.length,
                            upcoming: upcoming.length,
                            pending: pending.length,
                            declined: declined.length,
                            cancelled: cancelled.length,
                            hoursLearned: Math.round((minutesLearned / 60) * 10) / 10,
                            subjects: [...new Set(mine.map((s) => s.subject))],
                            tutors: [...tutorsSet],
                            nextSessionAt: upcoming[0]?.scheduled_at || null,
                            lastCompletedAt: completed[0]?.scheduled_at || null,
                        },
                    };
                });
            }
        }

        // ---- Pending admin requests for this user ----
        let adminRequests: unknown[] = [];
        const { data: requestRows } = await supabase
            .from('admin_requests')
            .select('id, type, message, status, created_at')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5);
        adminRequests = requestRows || [];

        // ---- Unread chat count ----
        let unreadMessages = 0;
        const { data: convos } = await supabase
            .from('conversations')
            .select('id')
            .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);
        if (convos && convos.length > 0) {
            const ids = convos.map((c) => c.id);
            const { count } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .in('conversation_id', ids)
                .neq('sender_id', user.id)
                .is('read_at', null);
            unreadMessages = count || 0;
        }

        return NextResponse.json({
            role,
            onboardingCompleted: profile?.onboarding_completed ?? null,
            tutor,
            student,
            children,
            incoming,
            upcoming,
            past,
            myBookings,
            recentFeedback,
            stats: {
                pendingCount: incoming.length,
                upcomingCount: upcoming.length,
                completedCount,
                earningsTotal,
                unreadMessages,
            },
            adminRequests,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
