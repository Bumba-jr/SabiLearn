import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * Type definitions for draft metadata
 */
export type FileType =
    | 'degree_certificate'
    | 'government_id'
    | 'nysc_certificate'
    | 'profile_photo'
    | 'intro_video';

export interface DraftMetadata {
    id: string;
    clerk_user_id: string;
    file_type: FileType;
    storage_path: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
    expires_at: string;
}

export interface CreateDraftInput {
    clerk_user_id: string;
    file_type: FileType;
    storage_path: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
}

export interface UpdateDraftInput {
    storage_path?: string;
    original_filename?: string;
    file_size?: number;
    mime_type?: string;
}

/**
 * Creates a new draft metadata record
 * Sets expires_at to 30 days from now
 * 
 * @param input - Draft metadata to create
 * @returns Created draft metadata
 * @throws Error if creation fails
 */
export async function createDraftMetadata(
    input: CreateDraftInput
): Promise<DraftMetadata> {
    const { data, error } = await supabaseAdmin
        .from('tutor_onboarding_drafts')
        .insert({
            clerk_user_id: input.clerk_user_id,
            file_type: input.file_type,
            storage_path: input.storage_path,
            original_filename: input.original_filename,
            file_size: input.file_size,
            mime_type: input.mime_type,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create draft metadata: ${error.message}`);
    }

    return data as DraftMetadata;
}

/**
 * Retrieves all draft metadata for a specific user
 * 
 * @param clerkUserId - The Clerk user ID
 * @returns Array of draft metadata records
 * @throws Error if query fails
 */
export async function getDraftsByUserId(
    clerkUserId: string
): Promise<DraftMetadata[]> {
    const { data, error } = await supabaseAdmin
        .from('tutor_onboarding_drafts')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .order('uploaded_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to get drafts for user: ${error.message}`);
    }

    return (data as DraftMetadata[]) || [];
}

/**
 * Retrieves a single draft by ID with ownership check
 * 
 * @param draftId - The draft ID
 * @param clerkUserId - The Clerk user ID (for ownership verification)
 * @returns Draft metadata or null if not found or not owned by user
 * @throws Error if query fails
 */
export async function getDraftById(
    draftId: string,
    clerkUserId: string
): Promise<DraftMetadata | null> {
    const { data, error } = await supabaseAdmin
        .from('tutor_onboarding_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        throw new Error(`Failed to get draft by ID: ${error.message}`);
    }

    return data as DraftMetadata;
}

/**
 * Updates an existing draft metadata record
 * 
 * @param draftId - The draft ID to update
 * @param clerkUserId - The Clerk user ID (for ownership verification)
 * @param updates - Fields to update
 * @returns Updated draft metadata
 * @throws Error if update fails or draft not found
 */
export async function updateDraftMetadata(
    draftId: string,
    clerkUserId: string,
    updates: UpdateDraftInput
): Promise<DraftMetadata> {
    const { data, error } = await supabaseAdmin
        .from('tutor_onboarding_drafts')
        .update(updates)
        .eq('id', draftId)
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update draft metadata: ${error.message}`);
    }

    return data as DraftMetadata;
}

/**
 * Deletes a single draft metadata record
 * 
 * @param draftId - The draft ID to delete
 * @param clerkUserId - The Clerk user ID (for ownership verification)
 * @returns True if deleted, false if not found
 * @throws Error if deletion fails
 */
export async function deleteDraftMetadata(
    draftId: string,
    clerkUserId: string
): Promise<boolean> {
    const { error, count } = await supabaseAdmin
        .from('tutor_onboarding_drafts')
        .delete({ count: 'exact' })
        .eq('id', draftId)
        .eq('clerk_user_id', clerkUserId);

    if (error) {
        throw new Error(`Failed to delete draft metadata: ${error.message}`);
    }

    return (count ?? 0) > 0;
}

/**
 * Deletes all draft metadata records for a user
 * 
 * @param clerkUserId - The Clerk user ID
 * @returns Number of drafts deleted
 * @throws Error if deletion fails
 */
export async function deleteAllUserDrafts(
    clerkUserId: string
): Promise<number> {
    const { error, count } = await supabaseAdmin
        .from('tutor_onboarding_drafts')
        .delete({ count: 'exact' })
        .eq('clerk_user_id', clerkUserId);

    if (error) {
        throw new Error(`Failed to delete all user drafts: ${error.message}`);
    }

    return count ?? 0;
}

/**
 * Retrieves all expired draft metadata records
 * (where expires_at < now())
 * 
 * @returns Array of expired draft metadata records
 * @throws Error if query fails
 */
export async function getExpiredDrafts(): Promise<DraftMetadata[]> {
    const { data, error } = await supabaseAdmin
        .from('tutor_onboarding_drafts')
        .select('*')
        .lt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

    if (error) {
        throw new Error(`Failed to get expired drafts: ${error.message}`);
    }

    return (data as DraftMetadata[]) || [];
}
