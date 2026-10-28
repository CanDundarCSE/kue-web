import { authFetch } from "@/lib/api/client";

// Shared client fetcher for the "continue" rail.
//
// Two home components need the same payload: `ContinueList` renders the rail
// and `SpotlightCard` picks its first entry as a seed for recommendations.
// Fetching it independently cost one duplicate Vercel invocation and one
// duplicate Render request per home load. A short TTL cache plus in-flight
// dedupe keeps it to a single request, and `invalidateContinueCache` drops the
// entry after a progress mutation.
const CACHE_TTL_MS = 30_000;

export type ContinueMedia = {
  id: number;
  title: string;
  mediaType: string;
  coverImage?: string | null;
  year?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
};

export type ContinueEntry = {
  mediaId: number;
  mediaType: string;
  status: string;
  progress?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  media: ContinueMedia;
};

let cache: { at: number; data: ContinueEntry[] } | null = null;
let inFlight: Promise<ContinueEntry[]> | null = null;

export function invalidateContinueCache() {
  cache = null;
  inFlight = null;
}

export function fetchContinueEntries(force = false): Promise<ContinueEntry[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return Promise.resolve(cache.data);
  }

  if (!inFlight) {
    inFlight = authFetch("/api/library/continue", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("load failed");
        const entries = data as ContinueEntry[];
        cache = { at: Date.now(), data: entries };
        return entries;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}
