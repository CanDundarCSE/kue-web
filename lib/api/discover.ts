import type { SearchMedia } from "@/lib/search";
import { invalidateLibraryPresence } from "@/lib/library-presence";

export type TrendingItem = SearchMedia & {
  rank: number;
  inLibrary?: boolean;
};

export type ReturningItem = {
  title: string;
  note: string;
};

export type DiscoverData = {
  trending: TrendingItem[];
  returning: ReturningItem[];
};

export type TopRatedItem = SearchMedia & { rank: number };

export async function fetchDiscover(type?: string | null): Promise<DiscoverData> {
  const url = type ? `/api/discover?type=${encodeURIComponent(type)}` : "/api/discover";
  const response = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return { trending: [], returning: [] };

  const data: unknown = await response.json().catch(() => null);
  const payload = data as {
    trending?: TrendingItem[];
    returning?: ReturningItem[];
  } | null;

  return {
    trending: Array.isArray(payload?.trending) ? payload.trending : [],
    returning: Array.isArray(payload?.returning) ? payload.returning : [],
  };
}

export async function fetchTopRated(pageSize = 10, type?: string | null): Promise<TopRatedItem[]> {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (type) params.set("type", type);
  const response = await fetch(`/api/top-rated?${params.toString()}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!response || !response.ok) return [];

  const data: unknown = await response.json().catch(() => null);
  const payload = data as { items?: SearchMedia[] } | null;
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map((item, i) => ({ ...item, rank: i + 1 }));
}


export async function addToLibraryFromDiscover(media: SearchMedia): Promise<boolean> {
  const payload: Record<string, unknown> = {
    mediaType: media.mediaType,
    status: "planning",
  };

  if (typeof media.id === "number" && media.id > 0) {
    payload.mediaId = media.id;
  } else {
    if (!media.externalSource || !media.externalId) return false;
    payload.externalSource = media.externalSource;
    payload.externalId = media.externalId;
  }

  if (media.title) payload.title = media.title;
  if (media.coverImage) payload.coverImage = media.coverImage;
  if (media.year !== null) payload.year = media.year;
  if (media.score !== null) payload.score = media.score;

  const response = await fetch("/api/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);

  const ok = !!response && response.ok;
  if (ok) invalidateLibraryPresence();
  return ok;
}

