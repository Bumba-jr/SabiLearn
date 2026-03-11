import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
    try {
        // Fetch a few tutors to check their avatar URLs
        const { data: tutors, error } = await supabaseAdmin
            .from('tutors')
            .select('id, name, avatar_url')
            .limit(5);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const results = tutors?.map(tutor => {
            let imageUrl = null;
            let urlType = 'none';

            if (tutor.avatar_url) {
                if (tutor.avatar_url.startsWith('http')) {
                    imageUrl = tutor.avatar_url;
                    urlType = 'full_url';
                } else {
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                    let storagePath = tutor.avatar_url;

                    storagePath = storagePath.replace(/^\/+/, '');

                    if (!storagePath.startsWith('avatars/')) {
                        storagePath = `avatars/${storagePath}`;
                    }

                    imageUrl = `${supabaseUrl}/storage/v1/object/public/${storagePath}`;
                    urlType = 'generated';
                }
            }

            return {
                id: tutor.id,
                name: tutor.name,
                original_avatar_url: tutor.avatar_url,
                generated_image_url: imageUrl,
                url_type: urlType,
                supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL
            };
        });

        return NextResponse.json({
            tutors: results,
            note: 'Check if the generated_image_url works in your browser'
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
