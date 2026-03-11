import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // Handle both Promise and direct params for Next.js compatibility
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;

        console.log('Received tutor ID:', id); // Debug log

        if (!id) {
            console.log('No ID provided in params:', resolvedParams);
            return NextResponse.json(
                { error: 'Tutor ID is required' },
                { status: 400 }
            );
        }

        // Fetch tutor by ID
        const { data: tutor, error } = await supabaseAdmin
            .from('tutors')
            .select('*')
            .eq('id', id)
            .eq('is_verified', true) // Only show verified tutors
            .single();

        if (error) {
            console.error('Error fetching tutor:', error);
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Tutor not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: 'Failed to fetch tutor' },
                { status: 500 }
            );
        }

        if (!tutor) {
            return NextResponse.json(
                { error: 'Tutor not found' },
                { status: 404 }
            );
        }

        // Transform data to match frontend expectations
        let imageUrl = null;
        if (tutor.avatar_url) {
            console.log('✅ Processing avatar_url for', tutor.name, ':', tutor.avatar_url);

            // Check if it's already a full URL
            if (tutor.avatar_url.startsWith('http')) {
                imageUrl = tutor.avatar_url;
            } else {
                // Construct the full URL for Supabase storage
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

                // Handle different avatar_url formats
                let storagePath = tutor.avatar_url;
                storagePath = storagePath.replace(/^\/+/, '');

                if (!storagePath.startsWith('avatars/')) {
                    storagePath = `avatars/${storagePath}`;
                }

                imageUrl = `${supabaseUrl}/storage/v1/object/public/${storagePath}`;
                console.log('✅ Generated image URL for', tutor.name, ':', imageUrl);
            }
        } else {
            console.log('❌ No avatar_url for tutor:', tutor.name);
        }

        // Get the most recent (latest) experience
        const latestExperience = tutor.experiences && tutor.experiences.length > 0
            ? tutor.experiences[tutor.experiences.length - 1]
            : null;

        // Calculate years of experience
        let yearsOfExperience = 0;
        if (tutor.experiences && tutor.experiences.length > 0) {
            const currentYear = new Date().getFullYear();
            const oldestExp = tutor.experiences[0];
            const newestExp = tutor.experiences[tutor.experiences.length - 1];

            const fromYear = parseInt(oldestExp.from_year || oldestExp.fromYear || '0');
            let toYear = currentYear;
            const toYearStr = newestExp.to_year || newestExp.toYear || '';

            if (toYearStr && toYearStr.toLowerCase() !== 'present') {
                toYear = parseInt(toYearStr);
            }

            if (fromYear > 0) {
                yearsOfExperience = toYear - fromYear;
            }
        }

        const transformedTutor = {
            id: tutor.id,
            name: tutor.name,
            university: latestExperience?.institute || 'Not specified',
            description: tutor.bio || 'No description available',
            bio: tutor.bio || 'No bio available',
            latestExperience: latestExperience ? {
                post: latestExperience.post || latestExperience.title,
                institute: latestExperience.institute || latestExperience.company,
                years: latestExperience.years || latestExperience.duration
            } : null,
            experiences: tutor.experiences || [],
            subjects: tutor.subjects || [],
            rating: tutor.rating || 0,
            reviews: tutor.total_reviews || 0,
            hourlyRate: tutor.hourly_rate && tutor.hourly_rate > 0 ? tutor.hourly_rate : null,
            verified: tutor.is_verified || false,
            image: imageUrl,
            availability: tutor.is_available ? 'Available for booking' : 'Currently unavailable',
            location: tutor.location || 'Not specified',
            gradeLevels: tutor.grade_levels || tutor.levels || [],
            examTypes: tutor.exam_types || [],
            yearsOfExperience: yearsOfExperience
        };

        return NextResponse.json(
            { tutor: transformedTutor },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in tutor profile API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}