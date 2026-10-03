// Shared client-side cache for tutor profile payloads, so navigating from
// the tutors list to a profile renders instantly instead of waiting on the
// detail API (which is slow on first hit in dev while Turbopack compiles).
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export function getCachedTutor(id: string): unknown | undefined {
    return cache.get(id);
}

export function setCachedTutor(id: string, tutor: unknown): void {
    cache.set(id, tutor);
}

// Fetches (or joins an in-flight fetch of) a tutor profile and caches it.
// Errors are swallowed — the profile page will fetch normally on miss.
export function prefetchTutor(id: string): void {
    if (cache.has(id) || inflight.has(id)) return;
    const promise = fetch(`/api/tutors/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
            if (data?.tutor) cache.set(id, data.tutor);
        })
        .catch(() => {})
        .finally(() => inflight.delete(id));
    inflight.set(id, promise);
}
