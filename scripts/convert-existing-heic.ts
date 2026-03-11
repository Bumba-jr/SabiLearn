/**
 * Script to convert existing HEIC images to JPEG
 * Run with: npx tsx scripts/convert-existing-heic.ts
 */

import { createClient } from '@supabase/supabase-js';
import { convertHeicToJpeg } from '../lib/utils/heic-converter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TutorWithHeic {
    id: string;
    auth_user_id: string;
    name: string;
    avatar_url: string;
}

async function findHeicImages(): Promise<TutorWithHeic[]> {
    console.log('🔍 Searching for tutors with HEIC images...\n');

    const { data: tutors, error } = await supabase
        .from('tutors')
        .select('id, auth_user_id, name, avatar_url')
        .not('avatar_url', 'is', null)
        .or('avatar_url.ilike.%.heic%,avatar_url.ilike.%.heif%');

    if (error) {
        console.error('❌ Error fetching tutors:', error);
        return [];
    }

    return tutors || [];
}

async function downloadHeicFile(url: string): Promise<Buffer> {
    console.log('📥 Downloading HEIC file...');
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function convertAndUploadImage(tutor: TutorWithHeic): Promise<string | null> {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📸 Processing: ${tutor.name}`);
        console.log(`   User ID: ${tutor.auth_user_id}`);
        console.log(`   Current URL: ${tutor.avatar_url}`);
        console.log(`${'='.repeat(60)}\n`);

        // Download the HEIC file
        const heicBuffer = await downloadHeicFile(tutor.avatar_url);
        console.log(`✅ Downloaded HEIC file (${heicBuffer.length} bytes)`);

        // Create a File object from the buffer
        const heicBlob = new Blob([heicBuffer], { type: 'image/heic' });
        const heicFile = new File([heicBlob], 'image.heic', { type: 'image/heic' });

        // Convert to JPEG
        console.log('🔄 Converting HEIC to JPEG...');
        const jpegFile = await convertHeicToJpeg(heicFile);
        console.log(`✅ Converted to JPEG (${jpegFile.size} bytes)`);

        // Extract the storage path from the old URL
        const urlParts = tutor.avatar_url.split('/drafts/')[1];
        if (!urlParts) {
            throw new Error('Could not parse storage path from URL');
        }

        // Create new path with .jpg extension
        const oldPath = urlParts;
        const newPath = oldPath.replace(/\.(heic|heif)$/i, '.jpg');

        console.log(`📁 Old path: ${oldPath}`);
        console.log(`📁 New path: ${newPath}`);

        // Upload the JPEG file
        console.log('⬆️  Uploading JPEG to storage...');
        const jpegBuffer = await jpegFile.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from('drafts')
            .upload(newPath, jpegBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('✅ JPEG uploaded successfully');

        // Get the new public URL
        const { data: publicUrlData } = supabase.storage
            .from('drafts')
            .getPublicUrl(newPath);

        const newUrl = publicUrlData.publicUrl;
        console.log(`🔗 New URL: ${newUrl}`);

        // Update the database
        console.log('💾 Updating database...');
        const { error: updateError } = await supabase
            .from('tutors')
            .update({ avatar_url: newUrl })
            .eq('id', tutor.id);

        if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
        }

        console.log('✅ Database updated');

        // Delete the old HEIC file
        console.log('🗑️  Deleting old HEIC file...');
        const { error: deleteError } = await supabase.storage
            .from('drafts')
            .remove([oldPath]);

        if (deleteError) {
            console.warn('⚠️  Warning: Could not delete old HEIC file:', deleteError.message);
        } else {
            console.log('✅ Old HEIC file deleted');
        }

        console.log(`\n✅ SUCCESS: ${tutor.name}'s image converted!\n`);
        return newUrl;

    } catch (error) {
        console.error(`\n❌ ERROR processing ${tutor.name}:`, error);
        return null;
    }
}

async function main() {
    console.log('\n🚀 HEIC to JPEG Conversion Script\n');
    console.log('This script will:');
    console.log('1. Find all tutors with HEIC images');
    console.log('2. Download each HEIC file');
    console.log('3. Convert to JPEG');
    console.log('4. Upload JPEG to storage');
    console.log('5. Update database with new URL');
    console.log('6. Delete old HEIC file\n');

    // Find tutors with HEIC images
    const tutorsWithHeic = await findHeicImages();

    if (tutorsWithHeic.length === 0) {
        console.log('✅ No HEIC images found. All images are already in compatible formats!\n');
        return;
    }

    console.log(`📊 Found ${tutorsWithHeic.length} tutor(s) with HEIC images:\n`);
    tutorsWithHeic.forEach((tutor, index) => {
        console.log(`${index + 1}. ${tutor.name} (${tutor.auth_user_id})`);
    });

    console.log('\n⏳ Starting conversion process...\n');

    // Convert each image
    const results = {
        success: 0,
        failed: 0,
        total: tutorsWithHeic.length,
    };

    for (const tutor of tutorsWithHeic) {
        const newUrl = await convertAndUploadImage(tutor);
        if (newUrl) {
            results.success++;
        } else {
            results.failed++;
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONVERSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total images: ${results.total}`);
    console.log(`✅ Successfully converted: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('='.repeat(60) + '\n');

    if (results.success === results.total) {
        console.log('🎉 All HEIC images have been converted to JPEG!\n');
    } else if (results.failed > 0) {
        console.log('⚠️  Some conversions failed. Check the errors above.\n');
    }
}

// Run the script
main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
