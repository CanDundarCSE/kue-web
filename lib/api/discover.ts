import type { SearchMedia } from "@/lib/search";

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

export async function fetchDiscover(): Promise<DiscoverData> {
  const response = await fetch("/api/discover", { cache: "no-store" }).catch(() => null);
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

export async function fetchTopRated(pageSize = 10): Promise<TopRatedItem[]> {
  const response = await fetch(`/api/top-rated?pageSize=${pageSize}`, {
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

  return !!response && response.ok;
}

