import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * Storage operations for draft files in Supabase Storage
 */

const DRAFTS_BUCKET = 'drafts';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Uploads a file to Supabase Storage in the drafts bucket
 * 
 * @param file - The file to upload
 * @param storagePath - The storage path (e.g., drafts/user_123/degree_certificate/file.pdf)
 * @returns The storage path of the uploaded file
 * @throws Error if upload fails
 */
export async function uploadDraftFile(
    file: File | Buffer,
    storagePath: string
): Promise<string> {
    console.log('📤 Starting file upload to Supabase Storage');
    console.log('Storage path:', storagePath);
    console.log('File size:', file instanceof File ? file.size : file.length);
    console.log('File type:', file instanceof File ? file.type : 'Buffer');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Has service key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        // Convert File to Buffer for better compatibility
        let fileBuffer: Buffer;
        let contentType: string;

        if (file instanceof File) {
            console.log('🔄 Converting File to Buffer...');
            const arrayBuffer = await file.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
            contentType = file.type;
            console.log('✅ File converted to Buffer, size:', fileBuffer.length);
        } else {
            fileBuffer = file;
            contentType = 'application/octet-stream';
            console.log('✅ Already a Buffer, size:', fileBuffer.length);
        }

        console.log('🔄 Attempting upload to Supabase...');
        console.log('Bucket:', DRAFTS_BUCKET);
        console.log('Content-Type:', contentType);

        const { data, error } = await supabaseAdmin.storage
            .from(DRAFTS_BUCKET)
            .upload(storagePath, fileBuffer, {
                contentType,
                upsert: false, // Don't overwrite existing files
            });

        if (error) {
            console.error('❌ Supabase storage error:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                statusCode: (error as any).statusCode,
                error: (error as any).error,
            });
            throw new Error(`Failed to upload file to storage: ${error.message}`);
        }

        console.log('✅ Upload successful, path:', data.path);
        return data.path;
    } catch (error) {
        console.error('❌ Upload exception:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Error cause:', error.cause);
        }

        // Re-throw with more context
        if (error instanceof Error && error.message.includes('fetch failed')) {
            throw new Error(`Network error connecting to Supabase Storage. Please check your internet connection and Supabase configuration. Original error: ${error.message}`);
        }

        throw error;
    }
}

/**
 * Deletes a file from Supabase Storage
 * 
 * @param storagePath - The storage path of the file to delete
 * @returns True if deleted successfully
 * @throws Error if deletion fails
 */
export async function deleteDraftFile(storagePath: string): Promise<boolean> {
    const { error } = await supabaseAdmin.storage
        .from(DRAFTS_BUCKET)
        .remove([storagePath]);

    if (error) {
        throw new Error(`Failed to delete file from storage: ${error.message}`);
    }

    return true;
}

/**
 * Generates a signed URL for temporary file access
 * 
 * @param storagePath - The storage path of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL for file access
 * @throws Error if URL generation fails
 */
export async function generateSignedUrl(
    storagePath: string,
    expiresIn: number = SIGNED_URL_EXPIRY
): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
        .from(DRAFTS_BUCKET)
        .createSignedUrl(storagePath, expiresIn);

    if (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
        throw new Error('Signed URL not returned from storage');
    }

    return data.signedUrl;
}

/**
 * Moves a draft file to permanent storage
 * Copies the file from drafts/ to a permanent location, then deletes the draft
 * 
 * @param draftPath - The current draft storage path
 * @param permanentPath - The destination permanent storage path
 * @param permanentBucket - The permanent storage bucket name (default: 'public')
 * @returns The permanent storage path
 * @throws Error if move operation fails
 */
export async function moveDraftToPermanent(
    draftPath: string,
    permanentPath: string,
    permanentBucket: string = 'public'
): Promise<string> {
    // Download the file from drafts
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from(DRAFTS_BUCKET)
        .download(draftPath);

    if (downloadError) {
        throw new Error(`Failed to download draft file: ${downloadError.message}`);
    }

    // Upload to permanent storage
    const { error: uploadError } = await supabaseAdmin.storage
        .from(permanentBucket)
        .upload(permanentPath, fileData, {
            contentType: fileData.type,
            upsert: false,
        });

    if (uploadError) {
        throw new Error(`Failed to upload to permanent storage: ${uploadError.message}`);
    }

    // Delete the draft file
    await deleteDraftFile(draftPath);

    return permanentPath;
}

/**
 * Checks if a file exists in storage
 * 
 * @param storagePath - The storage path to check
 * @returns True if file exists, false otherwise
 */
export async function fileExists(storagePath: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin.storage
        .from(DRAFTS_BUCKET)
        .list(storagePath.substring(0, storagePath.lastIndexOf('/')), {
            search: storagePath.substring(storagePath.lastIndexOf('/') + 1),
        });

    if (error) {
        return false;
    }

    return data && data.length > 0;
}
