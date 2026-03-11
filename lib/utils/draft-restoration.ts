import { type FileType, type DraftMetadata } from '@/lib/db/draft-operations';

interface DraftReference {
    draftId: string;
    filename: string;
    uploadedAt: string;
    fileType: FileType;
}

type DraftReferences = Record<FileType, DraftReference>;

const DRAFT_STORAGE_KEY = 'draft_references';

/**
 * Loads draft references from localStorage
 * 
 * @returns Object mapping file types to draft references
 */
export function loadDraftsFromLocalStorage(): Partial<DraftReferences> {
    try {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!stored) {
            return {};
        }
        return JSON.parse(stored) as Partial<DraftReferences>;
    } catch (error) {
        console.error('Failed to load drafts from localStorage:', error);
        return {};
    }
}

/**
 * Validates draft references against server data
 * Compares localStorage references with actual drafts from the server
 * 
 * @param clerkUserId - The user's Clerk ID
 * @returns Object mapping file types to validated draft metadata
 */
export async function validateDraftsWithServer(
    clerkUserId: string
): Promise<Record<string, DraftMetadata>> {
    try {
        // Get drafts from server
        const response = await fetch(`/api/drafts/${clerkUserId}`);

        // If the request fails, log the error but don't throw
        if (!response.ok) {
            console.warn('Could not fetch drafts from server:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });

            // Try to get error details
            try {
                const errorData = await response.text();
                console.warn('Server response:', errorData.substring(0, 500));
            } catch (e) {
                console.warn('Could not read error response');
            }

            return {};
        }

        const { drafts } = await response.json();
        const serverDrafts: DraftMetadata[] = drafts || [];

        // Get local references
        const localRefs = loadDraftsFromLocalStorage();

        // Create map of validated drafts
        const validatedDrafts: Record<string, DraftMetadata> = {};

        // Match server drafts with local references
        for (const serverDraft of serverDrafts) {
            const localRef = localRefs[serverDraft.file_type];

            // If local reference exists and matches server draft, it's valid
            if (localRef && localRef.draftId === serverDraft.id) {
                validatedDrafts[serverDraft.file_type] = serverDraft;
            } else {
                // Server has draft but local doesn't, add it
                validatedDrafts[serverDraft.file_type] = serverDraft;

                // Update localStorage with server data
                const updatedRefs = loadDraftsFromLocalStorage();
                updatedRefs[serverDraft.file_type] = {
                    draftId: serverDraft.id,
                    filename: serverDraft.original_filename,
                    uploadedAt: serverDraft.uploaded_at,
                    fileType: serverDraft.file_type,
                };
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedRefs));
            }
        }

        return validatedDrafts;
    } catch (error) {
        console.error('Failed to validate drafts with server:', error);
        // Return empty object instead of throwing
        return {};
    }
}

/**
 * Removes stale draft references from localStorage
 * (references that don't exist on the server)
 * 
 * @param clerkUserId - The user's Clerk ID
 */
export async function cleanupStaleDraftReferences(clerkUserId: string): Promise<void> {
    try {
        // Get drafts from server
        const response = await fetch(`/api/drafts/${clerkUserId}`);
        if (!response.ok) {
            // If table doesn't exist yet or other error, skip cleanup
            console.warn('Could not fetch drafts for cleanup:', {
                status: response.status,
                statusText: response.statusText
            });
            return;
        }

        const { drafts } = await response.json();
        const serverDrafts: DraftMetadata[] = drafts || [];
        const serverDraftIds = new Set(serverDrafts.map(d => d.id));

        // Get local references
        const localRefs = loadDraftsFromLocalStorage();

        // Remove stale references
        const cleanedRefs: Partial<DraftReferences> = {};
        for (const [fileType, ref] of Object.entries(localRefs)) {
            if (serverDraftIds.has(ref.draftId)) {
                cleanedRefs[fileType as FileType] = ref;
            }
        }

        // Update localStorage
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(cleanedRefs));
    } catch (error) {
        console.error('Failed to cleanup stale draft references:', error);
        // Don't throw - this is not critical for the user experience
    }
}

/**
 * Clears all draft references from localStorage
 * Used after successful form submission
 */
export function clearAllDraftReferences(): void {
    try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear draft references:', error);
    }
}
