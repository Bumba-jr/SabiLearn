import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { validateFile } from '@/lib/utils/file-validation';
import { generateStoragePath } from '@/lib/utils/storage-path';
import { uploadDraftFile, deleteDraftFile } from '@/lib/storage/draft-storage';
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
// Note: Body size limits in Next.js 15 App Router are handled at the framework level
// The default limit is ~4.5MB. For larger files, consider using streaming or chunked uploads

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
 * - clerkUserId: Clerk user ID
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
        const { userId } = await auth();
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
        const clerkUserId = formData.get('clerkUserId') as string | null;

        console.log('📋 Form data:', {
            hasFile: !!file,
            fileSize: file?.size,
            fileName: file?.name,
            fileType,
            clerkUserId
        });

        // Validate required fields
        if (!file || !fileType || !clerkUserId) {
            return NextResponse.json(
                { error: 'Missing required fields: file, fileType, clerkUserId' },
                { status: 400 }
            );
        }

        // Verify user ID matches authenticated user
        if (clerkUserId !== userId) {
            return NextResponse.json(
                {
                    error: 'Forbidden: User ID mismatch',
                    debug: {
                        authenticatedUserId: userId,
                        requestedUserId: clerkUserId
                    }
                },
                { status: 403 }
            );
        }

        // Validate file
        const validation = validateFile(file, fileType);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // Generate storage path
        const storagePath = generateStoragePath(clerkUserId, fileType, file.name);

        // Check if draft already exists for this file type
        const existingDrafts = await getDraftsByUserId(clerkUserId);
        const existingDraft = existingDrafts.find(d => d.file_type === fileType);

        let draftMetadata;
        let oldStoragePath: string | null = null;

        if (existingDraft) {
            // File replacement: upload new file, update metadata, delete old file
            oldStoragePath = existingDraft.storage_path;

            // Begin transaction-like operation
            try {
                // Upload new file
                await uploadDraftFile(file, storagePath);

                // Update metadata
                draftMetadata = await updateDraftMetadata(
                    existingDraft.id,
                    clerkUserId,
                    {
                        storage_path: storagePath,
                        original_filename: file.name,
                        file_size: file.size,
                        mime_type: file.type,
                    }
                );

                // Delete old file
                if (oldStoragePath) {
                    await deleteDraftFile(oldStoragePath);
                }
            } catch (error) {
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
                // Upload file
                await uploadDraftFile(file, storagePath);

                // Create metadata
                draftMetadata = await createDraftMetadata({
                    clerk_user_id: clerkUserId,
                    file_type: fileType,
                    storage_path: storagePath,
                    original_filename: file.name,
                    file_size: file.size,
                    mime_type: file.type,
                });
            } catch (error) {
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
