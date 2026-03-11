import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');
        const level = searchParams.get('level');
        const verified = searchParams.get('verified');

        // Build query
        let query = supabaseAdmin
            .from('tutors')
            .select('*')
            .eq('is_available', true)
            .eq('is_verified', true) // Only show verified tutors
            .order('rating', { ascending: false });

        // Apply filters
        if (verified === 'true') {
            query = query.eq('is_verified', true);
        }

        if (subject) {
            query = query.contains('subjects', [subject]);
        }

        if (level) {
            query = query.contains('grade_levels', [level]);
        }

        const { data: tutors, error } = await query;

        if (error) {
            console.error('Error fetching tutors:', error);
            return NextResponse.json(
                { error: 'Failed to fetch tutors' },
                { status: 500 }
            );
        }

        // Transform data to match frontend expectations
        const transformedTutors = tutors?.map(tutor => {
            // Generate proper image URL from Supabase storage
            let imageUrl = null;
            if (tutor.avatar_url) {
                console.log('✅ Processing avatar_url for', tutor.name, ':', tutor.avatar_url);

                // Check if it's already a full URL
                if (tutor.avatar_url.startsWith('http')) {
                    imageUrl = tutor.avatar_url;
                } else {
                    // Construct the full URL for Supabase storage
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

                    // Handle different avatar_url formats:
                    // 1. Just filename: "abc123.jpg"
                    // 2. With bucket path: "avatars/abc123.jpg"
                    // 3. Full storage path: "public/avatars/abc123.jpg"

                    let storagePath = tutor.avatar_url;

                    // Remove any leading slashes
                    storagePath = storagePath.replace(/^\/+/, '');

                    // If it doesn't include the bucket name, add it
                    if (!storagePath.startsWith('avatars/')) {
                        storagePath = `avatars/${storagePath}`;
                    }

                    imageUrl = `${supabaseUrl}/storage/v1/object/public/${storagePath}`;
                    console.log('✅ Generated image URL for', tutor.name, ':', imageUrl);
                }
            } else {
                console.log('❌ No avatar_url for tutor:', tutor.name);
            }

            // Get the most recent (latest) experience - last item in array
            const latestExperience = tutor.experiences && tutor.experiences.length > 0
                ? tutor.experiences[tutor.experiences.length - 1]
                : null;

            // Calculate years of experience
            let yearsOfExperience = 0;
            if (tutor.experiences && tutor.experiences.length > 0) {
                const currentYear = new Date().getFullYear();

                // Experiences are ordered oldest first, newest last
                const oldestExp = tutor.experiences[0]; // First experience (oldest)
                const newestExp = tutor.experiences[tutor.experiences.length - 1]; // Last experience (newest)

                // Parse from year from oldest experience
                const fromYear = parseInt(oldestExp.from_year || oldestExp.fromYear || '0');

                // Parse to year from newest experience (use current year if "Present")
                let toYear = currentYear;
                const toYearStr = newestExp.to_year || newestExp.toYear || '';

                if (toYearStr && toYearStr.toLowerCase() !== 'present') {
                    toYear = parseInt(toYearStr);
                }

                if (fromYear > 0) {
                    yearsOfExperience = toYear - fromYear;
                }
            }

            return {
                id: tutor.id,
                name: tutor.name,
                university: latestExperience?.institute || 'Not specified',
                description: tutor.bio || 'No description available',
                latestExperience: latestExperience ? {
                    post: latestExperience.post || latestExperience.title,
                    institute: latestExperience.institute || latestExperience.company,
                    years: latestExperience.years || latestExperience.duration
                } : null,
                subjects: tutor.subjects || [],
                rating: tutor.rating || 0,
                reviews: tutor.total_reviews || 0,
                hourlyRate: tutor.hourly_rate && tutor.hourly_rate > 0 ? tutor.hourly_rate : null,
                verified: tutor.is_verified || false,
                image: imageUrl,
                availability: tutor.is_available ? 'Available' : 'Unavailable',
                location: tutor.location || 'Not specified',
                gradeLevels: tutor.grade_levels || tutor.levels || [],
                examTypes: tutor.exam_types || [],
                yearsOfExperience: yearsOfExperience
            };
        }) || [];

        return NextResponse.json(
            { tutors: transformedTutors },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in tutors API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
