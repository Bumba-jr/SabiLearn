import { NextResponse } from 'next/server';
import { getServerUser, isAdmin } from '@/lib/auth/supabase-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const user = await getServerUser();

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const verified = searchParams.get('verified');

        // Fetch all tutors
        const { data: tutors } = await supabaseAdmin
            .from('tutors')
            .select('*')
            .order('created_at', { ascending: false });

        // Fetch all students
        const { data: students } = await supabaseAdmin
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        // Fetch all profiles
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // Real uploaded files live in tutor_onboarding_drafts. The tutors table
        // often stores truncated folder URLs, so resolve proper file URLs here.
        const { data: draftRows, error: draftsError } = await supabaseAdmin
            .from('tutor_onboarding_drafts')
            .select('clerk_user_id, auth_user_id, file_type, storage_path, original_filename, mime_type');

        if (draftsError) {
            console.error('Drafts fetch error:', draftsError.message);
        }

        const draftsByUser = new Map<string, any[]>();
        for (const d of draftRows || []) {
            const ownerId = d.auth_user_id || d.clerk_user_id;
            if (!ownerId) continue;
            if (!draftsByUser.has(ownerId)) draftsByUser.set(ownerId, []);
            draftsByUser.get(ownerId)!.push(d);
        }

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const publicFileUrl = (storagePath: string) =>
            `${SUPABASE_URL}/storage/v1/object/public/drafts/${storagePath}`;

        const isFolderOnly = (url?: string | null) =>
            !url || url.endsWith('/') || !/\/[a-z_]+\/\d{10,}_/i.test(url);

        function resolveDocuments(ownerId?: string | null) {
            const rows = (ownerId ? draftsByUser.get(ownerId) : undefined) || [];
            const byType: Record<string, any> = {};
            for (const d of rows) {
                // Keep the newest upload per file type
                if (!byType[d.file_type] || (d.storage_path > (byType[d.file_type].storage_path || ''))) {
                    byType[d.file_type] = d;
                }
            }
            return byType;
        }

        console.log('Fetched data:', {
            tutors: tutors?.length || 0,
            students: students?.length || 0,
            profiles: profiles?.length || 0
        });

        // Build users array from tutors, students, and profiles
        const users: any[] = [];
        const processedAuthUserIds = new Set<string>();

        // Add all tutors
        if (tutors) {
            for (const tutor of tutors) {
                // Find matching profile
                const profile = profiles?.find(p =>
                    p.auth_user_id === tutor.auth_user_id ||
                    p.id === tutor.user_id
                );

                if (tutor.auth_user_id) {
                    processedAuthUserIds.add(tutor.auth_user_id);
                }

                const ownerId = tutor.auth_user_id || profile?.auth_user_id || tutor.clerk_user_id;
                const docs = resolveDocuments(ownerId);
                const docUrl = (type: string, fallback?: string | null) =>
                    docs[type]?.storage_path ? publicFileUrl(docs[type].storage_path) : (isFolderOnly(fallback) ? null : fallback);

                users.push({
                    id: tutor.id,
                    profile_id: profile?.id || tutor.user_id,
                    auth_user_id: tutor.auth_user_id || profile?.auth_user_id,
                    clerk_user_id: tutor.clerk_user_id,
                    role: 'tutor',
                    name: tutor.name,
                    email: tutor.email,
                    phone: tutor.phone,
                    avatar_url: docUrl('profile_photo', tutor.avatar_url) || tutor.avatar_url,
                    intro_video_url: docUrl('intro_video', tutor.intro_video_url),
                    degree_certificate_url: docUrl('degree_certificate', tutor.degree_certificate_url),
                    government_id_url: docUrl('government_id', tutor.government_id_url),
                    nysc_certificate_url: docUrl('nysc_certificate', tutor.nysc_certificate_url),
                    documents: [
                        docs['degree_certificate'] && { type: 'Degree Certificate', url: publicFileUrl(docs['degree_certificate'].storage_path), filename: docs['degree_certificate'].original_filename, mimeType: docs['degree_certificate'].mime_type },
                        docs['government_id'] && { type: 'Government ID', url: publicFileUrl(docs['government_id'].storage_path), filename: docs['government_id'].original_filename, mimeType: docs['government_id'].mime_type },
                        docs['nysc_certificate'] && { type: 'NYSC Certificate', url: publicFileUrl(docs['nysc_certificate'].storage_path), filename: docs['nysc_certificate'].original_filename, mimeType: docs['nysc_certificate'].mime_type },
                        docs['intro_video'] && { type: 'Intro Video', url: publicFileUrl(docs['intro_video'].storage_path), filename: docs['intro_video'].original_filename, mimeType: docs['intro_video'].mime_type },
                        docs['profile_photo'] && { type: 'Profile Photo', url: publicFileUrl(docs['profile_photo'].storage_path), filename: docs['profile_photo'].original_filename, mimeType: docs['profile_photo'].mime_type },
                    ].filter(Boolean),
                    bio: tutor.bio,
                    subjects: tutor.subjects,
                    grade_levels: tutor.grade_levels,
                    hourly_rate: tutor.hourly_rate,
                    location: tutor.location,
                    is_verified: tutor.is_verified,
                    is_available: tutor.is_available,
                    rating: tutor.rating,
                    total_reviews: tutor.total_reviews,
                    experiences: tutor.experiences || [],
                    experience_level: tutor.experience_level,
                    onboarding_completed: profile?.onboarding_completed ?? true,
                    created_at: tutor.created_at,
                    updated_at: tutor.updated_at
                });
            }
        }

        // Add all students
        if (students) {
            for (const student of students) {
                // Find matching profile
                const profile = profiles?.find(p =>
                    p.auth_user_id === student.auth_user_id ||
                    p.id === student.user_id
                );

                if (student.auth_user_id) {
                    processedAuthUserIds.add(student.auth_user_id);
                }

                users.push({
                    id: student.id,
                    profile_id: profile?.id || student.user_id,
                    auth_user_id: student.auth_user_id || profile?.auth_user_id,
                    clerk_user_id: student.clerk_user_id,
                    role: 'student',
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    avatar_url: student.avatar_url,
                    grade_level: student.grade_level,
                    parent_name: student.parent_name,
                    parent_email: student.parent_email,
                    parent_phone: student.parent_phone,
                    onboarding_completed: profile?.onboarding_completed ?? true,
                    created_at: student.created_at,
                    updated_at: student.updated_at
                });
            }
        }

        // Add profiles that don't have corresponding tutor/student records (incomplete onboarding)
        if (profiles) {
            for (const profile of profiles) {
                // Skip if already processed
                if (profile.auth_user_id && processedAuthUserIds.has(profile.auth_user_id)) {
                    continue;
                }

                // Get user email from auth.users
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.auth_user_id);

                users.push({
                    id: profile.id,
                    profile_id: profile.id,
                    auth_user_id: profile.auth_user_id,
                    role: profile.role || 'pending',
                    name: 'Incomplete Profile',
                    email: authUser?.user?.email || 'N/A',
                    phone: null,
                    avatar_url: null,
                    onboarding_completed: profile.onboarding_completed || false,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at
                });
            }
        }

        console.log('Users before deduplication:', users.length);

        // Deduplicate users by auth_user_id, profile_id, or id (keep the most recent one with complete data)
        const uniqueUsers = users.reduce((acc: any[], user: any) => {
            // Use auth_user_id as primary identifier, fallback to profile_id or id
            const userId = user.auth_user_id || user.profile_id || user.id;

            const existingIndex = acc.findIndex(u => {
                const existingUserId = u.auth_user_id || u.profile_id || u.id;
                return existingUserId === userId;
            });

            if (existingIndex === -1) {
                // User doesn't exist in accumulator, add it
                acc.push(user);
            } else {
                // User exists, keep the one with more complete data (has name/email)
                const existing = acc[existingIndex];
                if (user.name && !existing.name) {
                    acc[existingIndex] = user;
                } else if (user.created_at > existing.created_at) {
                    // Or keep the more recent one
                    acc[existingIndex] = user;
                }
            }

            return acc;
        }, []);

        console.log('Unique users after deduplication:', uniqueUsers.length);

        // Apply role filter if specified
        let filteredUsers = uniqueUsers;
        if (role && role !== 'all') {
            filteredUsers = uniqueUsers.filter(u => u.role === role);
            console.log(`Users after role filter (${role}):`, filteredUsers.length);
        }

        // Apply verified filter if specified
        if (verified === 'true') {
            filteredUsers = filteredUsers.filter(u => u.is_verified === true);
        } else if (verified === 'false') {
            filteredUsers = filteredUsers.filter(u => u.is_verified !== true);
        }

        return NextResponse.json({ users: filteredUsers });
    } catch (error) {
        console.error('Error in admin users API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
