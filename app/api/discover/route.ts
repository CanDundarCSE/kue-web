import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

// Trending media — fetched without auth so the Discover page is visible
// even before signing in. Falls back to the search endpoint with popularity
// sorting when the backend doesn't expose a dedicated /discover route yet.
export async function GET() {
  // Try dedicated discover / trending endpoint first.
  const trendingUrl = `${API_BASE_URL}/api/v1/media/trending?pageSize=10`;
  let upstream: Response | null = null;

  try {
    upstream = await fetch(trendingUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    upstream = null;
  }

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
  type ReturningItem = { title: string; note: string };

  let trending: TrendingItem[] = [];
  let returning: ReturningItem[] = [];

  if (upstream && upstream.ok) {
    const payload: unknown = await upstream.json().catch(() => null);

    // Backend may return { items: [...] } or a bare array.
    const items: RawItem[] = (() => {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload as RawItem[];
      const obj = payload as { items?: RawItem[]; trending?: RawItem[] };
      return Array.isArray(obj.items)
        ? obj.items
        : Array.isArray(obj.trending)
          ? obj.trending
          : [];
    })();

    trending = items.slice(0, 10).map((item, i) => ({ ...item, rank: i + 1 }));

    // Try to pull "returning soon" from the same payload if available.
    const raw = payload as {
      returning?: Array<{ title?: string; note?: string; status?: string }>;
    } | null;
    if (Array.isArray(raw?.returning)) {
      returning = raw.returning
        .filter((r) => r.title)
        .map((r) => ({
          title: r.title ?? "",
          note: r.note ?? r.status ?? "",
        }));
    }
  } else {
    // Fallback: search for popular titles to populate the page.
    const fallbackTerms = [
      { q: "dune", type: "movie" },
      { q: "severance", type: "series" },
      { q: "chainsaw man", type: "manga" },
      { q: "baldur", type: "game" },
      { q: "frieren", type: "anime" },
    ];

    const results = await Promise.allSettled(
      fallbackTerms.map(({ q, type }) =>
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

    trending = found.map((item, i) => ({ ...item, rank: i + 1 }));
  }

  return Response.json({ trending, returning }, { headers: NO_STORE });
}

