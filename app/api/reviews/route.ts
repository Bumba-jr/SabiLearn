import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function getAuthUser(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// Recompute and persist a tutor's aggregate rating from the reviews table
async function refreshTutorRating(tutorId: string) {
    const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('tutor_id', tutorId);

    const count = reviews?.length || 0;
    const avg = count > 0
        ? Math.round((reviews!.reduce((s, r) => s + (r.rating || 0), 0) / count) * 10) / 10
        : 0;

    await supabaseAdmin
        .from('tutors')
        .update({ rating: avg, total_reviews: count })
        .eq('id', tutorId);
}

// GET /api/reviews?tutorId=... — public reviews for a tutor
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tutorId = searchParams.get('tutorId');
        if (!tutorId) {
            return NextResponse.json({ error: 'tutorId is required' }, { status: 400 });
        }

        const { data: reviews, error } = await supabaseAdmin
            .from('reviews')
            .select('id, rating, comment, created_at, student_id')
            .eq('tutor_id', tutorId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching reviews:', error);
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
        }

        // Attach student first names (students.user_id holds the auth uuid as text)
        const studentIds = [...new Set((reviews || []).map((r) => r.student_id))];
        let namesById: Record<string, string> = {};
        if (studentIds.length > 0) {
            const { data: students } = await supabaseAdmin
                .from('students')
                .select('id, name')
                .in('id', studentIds);
            namesById = Object.fromEntries((students || []).map((s) => [s.id, s.name]));
        }

        return NextResponse.json({
            reviews: (reviews || []).map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at,
                studentName: namesById[r.student_id]?.split(' ')[0] || 'Parent',
            })),
        });
    } catch (error) {
        console.error('Error in reviews GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/reviews — a student reviews a completed session
export async function POST(req: Request) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, rating, comment } = body;

        if (!sessionId || !rating) {
            return NextResponse.json({ error: 'Session and rating are required' }, { status: 400 });
        }
        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
        }

        // The session must exist, belong to this user's student record, and be completed
        const { data: studentRow } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!studentRow) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const { data: session, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select('id, tutor_id, student_id, status')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        if (session.student_id !== studentRow.id) {
            return NextResponse.json({ error: 'You can only review your own lessons' }, { status: 403 });
        }
        if (session.status !== 'completed') {
            return NextResponse.json({ error: 'You can only review completed lessons' }, { status: 400 });
        }

        // One review per session
        const { data: existing } = await supabaseAdmin
            .from('reviews')
            .select('id')
            .eq('session_id', sessionId)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'You have already reviewed this lesson' }, { status: 409 });
        }

        const { data: review, error: insertError } = await supabaseAdmin
            .from('reviews')
            .insert({
                session_id: sessionId,
                tutor_id: session.tutor_id,
                student_id: studentRow.id,
                rating: ratingNum,
                comment: comment || null,
            })
            .select('id, rating, comment, created_at')
            .single();

        if (insertError) {
            console.error('Error creating review:', insertError);
            return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
        }

        await refreshTutorRating(session.tutor_id);

        return NextResponse.json({ review }, { status: 201 });
    } catch (error) {
        console.error('Error in reviews POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
