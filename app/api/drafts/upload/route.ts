import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/supabase-auth';
import { validateFile } from '@/lib/utils/file-validation';
import { generateStoragePath } from '@/lib/utils/storage-path';
import { uploadDraftFile, deleteDraftFile } from '@/lib/storage/draft-storage';
import { convertHeicIfNeeded } from '@/lib/utils/heic-converter';
import {
    createDraftMetadata,
    getDraftsByUserId,
    updateDraftMetadata,
    type FileType,
} from '@/lib/db/draft-operations';
import { supabaseAdmin } from '@/lib/supabase-server';

// Configure route segment to allow larger request bodies
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

// Increase body size limit for file uploads (100MB for videos)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * GET /api/drafts/upload
 * Test endpoint to verify route is accessible
 */
export async function GET() {
    console.log('✅ GET /api/drafts/upload hit');
    return NextResponse.json({ message: 'Upload endpoint is accessible' });
}

/**
 * POST /api/drafts/upload
 * Uploads a file and creates/updates draft metadata
 * 
 * Request body (multipart/form-data):
 * - file: File to upload
 * - fileType: One of the supported file types
 * 
 * Response:
 * - 201: Draft created successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (user ID mismatch)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
    console.log('📤 Upload route hit - Request received');
    console.log('Content-Type:', request.headers.get('content-type'));
    console.log('Content-Length:', request.headers.get('content-length'));
    console.log('URL:', request.url);
    console.log('Method:', request.method);

    try {
        // Verify authentication
        const user = await getServerUser();
        const userId = user?.id;
        console.log('🔐 Auth check - userId:', userId);
        if (!userId) {
            console.log('❌ No userId - returning 401');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse form data
        console.log('📦 Attempting to parse formData...');
        let formData;
        try {
            formData = await request.formData();
            console.log('✅ FormData parsed successfully');
        } catch (parseError) {
            console.error('❌ FormData parsing failed:', parseError);
            return NextResponse.json(
                {
                    error: 'Failed to parse form data',
                    details: parseError instanceof Error ? parseError.message : 'Unknown error'
                },
                { status: 400 }
            );
        }

        const file = formData.get('file') as File | null;
        const fileType = formData.get('fileType') as FileType | null;

        console.log('📋 Form data:', {
            hasFile: !!file,
            fileSize: file?.size,
            fileName: file?.name,
            fileType,
            userId
        });

        // Validate required fields
        if (!file || !fileType) {
            return NextResponse.json(
                { error: 'Missing required fields: file, fileType' },
                { status: 400 }
            );
        }

        // Validate file
        const validation = validateFile(file, fileType);
        if (!validation.valid) {
            console.log('❌ File validation failed:', validation.error);
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // Convert HEIC to JPEG if needed (for profile photos)
        let processedFile = file;
        if (fileType === 'profile_photo') {
            try {
                processedFile = await convertHeicIfNeeded(file);
                if (processedFile !== file) {
                    console.log('✅ HEIC file converted to JPEG');
                }
            } catch (conversionError) {
                console.error('❌ HEIC conversion error:', conversionError);
                return NextResponse.json(
                    {
                        error: 'Failed to process image file',
                        details: conversionError instanceof Error ? conversionError.message : 'Unknown error'
                    },
                    { status: 400 }
                );
            }
        }

        // Generate storage path (use processed file name)
        const storagePath = generateStoragePath(userId, fileType, processedFile.name);
        console.log('📁 Generated storage path:', storagePath);

        // Check if draft already exists for this file type
        console.log('🔍 Checking for existing drafts...');
        const existingDrafts = await getDraftsByUserId(userId);
        console.log('📦 Existing drafts:', existingDrafts.length);
        const existingDraft = existingDrafts.find(d => d.file_type === fileType);
        console.log('🔄 Found existing draft for this type:', !!existingDraft);

        let draftMetadata;
        let oldStoragePath: string | null = null;

        if (existingDraft) {
            // File replacement: upload new file, update metadata, delete old file
            oldStoragePath = existingDraft.storage_path;

            // Begin transaction-like operation
            try {
                // Upload new file (use processed file)
                console.log('⬆️ Uploading new file to replace existing...');
                await uploadDraftFile(processedFile, storagePath);
                console.log('✅ File uploaded successfully');

                // Update metadata (use processed file info)
                console.log('📝 Updating metadata...');
                draftMetadata = await updateDraftMetadata(
                    existingDraft.id,
                    userId,
                    {
                        storage_path: storagePath,
                        original_filename: processedFile.name,
                        file_size: processedFile.size,
                        mime_type: processedFile.type,
                    }
                );
                console.log('✅ Metadata updated');

                // Delete old file
                if (oldStoragePath) {
                    console.log('🗑️ Deleting old file:', oldStoragePath);
                    await deleteDraftFile(oldStoragePath);
                    console.log('✅ Old file deleted');
                }
            } catch (error) {
                console.error('❌ Error during file replacement:', error);
                // Rollback: delete newly uploaded file if metadata update failed
                try {
                    await deleteDraftFile(storagePath);
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded file:', cleanupError);
                }
                throw error;
            }
        } else {
            // New draft: upload file and create metadata
            try {
                // Upload file (use processed file)
                console.log('⬆️ Uploading new file...');
                await uploadDraftFile(processedFile, storagePath);
                console.log('✅ File uploaded successfully');

                // Create metadata (use processed file info)
                console.log('📝 Creating metadata...');
                draftMetadata = await createDraftMetadata({
                    auth_user_id: userId,
                    file_type: fileType,
                    storage_path: storagePath,
                    original_filename: processedFile.name,
                    file_size: processedFile.size,
                    mime_type: processedFile.type,
                });
                console.log('✅ Metadata created');
            } catch (error) {
                console.error('❌ Error during new file upload:', error);
                // Rollback: delete uploaded file if metadata creation failed
                try {
                    await deleteDraftFile(storagePath);
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded file:', cleanupError);
                }
                throw error;
            }
        }

        return NextResponse.json(
            {
                message: existingDraft ? 'Draft updated successfully' : 'Draft created successfully',
                draft: draftMetadata,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Draft upload error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            cause: error instanceof Error ? error.cause : undefined
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
                stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
