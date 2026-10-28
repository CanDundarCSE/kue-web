import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";
import { publicCache } from "@/lib/api/cache";

type RawItem = {
  id?: number;
  mediaType?: string;
  title?: string;
  year?: number | null;
  score?: number | null;
  coverImage?: string | null;
  description?: string | null;
  externalSource?: string | null;
  externalId?: string | null;
  status?: string | null;
  totalUnits?: number | null;
};

type TrendingItem = RawItem & { rank: number };

const DISCOVER_TYPES = ["movie", "series", "anime", "manga", "game"] as const;
type DiscoverType = (typeof DISCOVER_TYPES)[number];

function isDiscoverType(value: string | null): value is DiscoverType {
  return value !== null && (DISCOVER_TYPES as readonly string[]).includes(value);
}

const FALLBACK_TERMS: Record<DiscoverType, { q: string; type: string }> = {
  movie: { q: "dune", type: "movie" },
  series: { q: "severance", type: "series" },
  anime: { q: "frieren", type: "anime" },
  manga: { q: "chainsaw man", type: "manga" },
  game: { q: "baldur", type: "game" },
};

function extractItems(payload: unknown): RawItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as RawItem[];
  const obj = payload as { items?: RawItem[]; trending?: RawItem[] };
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.trending)) return obj.trending;
  return [];
}

async function fetchTrendingPage(type: string, pageSize: number): Promise<RawItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/media/trending?type=${type}&pageSize=${pageSize}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) return [];
    return extractItems(await response.json().catch(() => null));
  } catch {
    return [];
  }
}

// Round-robin across the per-type lists so the mixed rail stays balanced
// instead of clustering one media type at the top.
function interleave<T>(lists: T[][], limit: number): T[] {
  const out: T[] = [];
  for (let i = 0; out.length < limit; i++) {
    let progressed = false;
    for (const list of lists) {
      if (i < list.length && out.length < limit) {
        out.push(list[i]);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return out;
}

// Last-resort fallback: one popular hit per given term via search.
async function fetchSearchFallback(
  terms: { q: string; type: string }[],
): Promise<TrendingItem[]> {
  const results = await Promise.allSettled(
    terms.map(({ q, type }) =>
      fetch(
        `${API_BASE_URL}/api/v1/search?query=${encodeURIComponent(q)}&type=${type}&pageSize=1`,
        { headers: { Accept: "application/json" }, cache: "no-store" },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ),
  );

  const found: RawItem[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const payload = result.value as { items?: RawItem[] };
    const first = Array.isArray(payload?.items) ? payload.items[0] : null;
    if (first) found.push(first as RawItem);
  }

  return found.map((item, i) => ({ ...item, rank: i + 1 }));
}

// Trending media — fetched without auth so the Discover page is visible
// even before signing in.
//
// The backend only serves one media type per trending call (TMDB for
// film/series, AniList for anime/manga, IGDB for games), so an unfiltered
// request is fanned out across all five types and interleaved. Pass
// ?type=movie|series|anime|manga|game for a single-type rail.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  if (isDiscoverType(typeParam)) {
    const items = await fetchTrendingPage(typeParam, 10);
    const trending =
      items.length > 0
        ? items.slice(0, 10).map((item, i) => ({ ...item, rank: i + 1 }))
        : await fetchSearchFallback([FALLBACK_TERMS[typeParam]]);
    // An empty rail means every upstream catalog call failed. Do not let a
    // transient outage be published to the CDN as a valid empty catalog.
    return Response.json(
      { trending, returning: [] },
      { headers: trending.length > 0 ? publicCache(60, 300) : NO_STORE },
    );
  }

  const perType = await Promise.all(
    DISCOVER_TYPES.map((type) => fetchTrendingPage(type, 3)),
  );
  const mixed = interleave(perType, 10);

  let trending: TrendingItem[];
  if (mixed.length > 0) {
    trending = mixed.map((item, i) => ({ ...item, rank: i + 1 }));
  } else {
    // Last resort: one popular hit per type via search.
    trending = await fetchSearchFallback(Object.values(FALLBACK_TERMS));
  }

  return Response.json(
    { trending, returning: [] },
    { headers: trending.length > 0 ? publicCache(60, 300) : NO_STORE },
  );
}

