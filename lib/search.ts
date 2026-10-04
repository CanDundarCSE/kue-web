export type SearchMedia = {
  id: number;
  mediaType: string;
  title: string;
  year: number | null;
  score: number | null;
  coverImage: string | null;
  description: string | null;
  externalSource: string | null;
  externalId: string | null;
};

export type SearchPage = {
  items: SearchMedia[];
  totalItems: number;
  totalPages: number;
};

// Catalog results are not persisted yet, so every item reports id 0 and is
// actually identified by its external source/id pair. Fall back to the row
// index only if a result somehow carries neither.
export function mediaKey(media: SearchMedia, index: number): string {
  if (typeof media.id === "number" && media.id > 0) return `id:${media.id}`;
  if (media.externalSource && media.externalId) {
    return `ext:${media.externalSource}:${media.externalId}`;
  }
  return `row:${index}`;
}

export function buildSearchUrl(query: string, type: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (type) params.set("type", type);
  return `/api/search?${params.toString()}`;
}

export async function fetchSearchPage(
  query: string,
  type: string,
  page: number,
  pageSize: number,
): Promise<SearchPage | null> {
  const response = await fetch(buildSearchUrl(query, type, page, pageSize), {
    cache: "no-store",
  }).catch(() => null);

  if (!response || !response.ok) return null;

  const data: unknown = await response.json().catch(() => null);
  const payload = data as {
    items?: SearchMedia[];
    totalItems?: number;
    totalPages?: number;
  } | null;

  if (!payload || !Array.isArray(payload.items)) return null;

  const items = payload.items;
  return {
    items,
    totalItems: typeof payload.totalItems === "number" ? payload.totalItems : items.length,
    totalPages:
      typeof payload.totalPages === "number"
        ? payload.totalPages
        : Math.max(1, Math.ceil(items.length / pageSize)),
  };
}
