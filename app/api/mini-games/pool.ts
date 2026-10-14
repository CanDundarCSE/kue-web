import { API_BASE_URL } from "@/lib/api/backend";

export type PoolItem = {
  id?: number;
  mediaType?: string;
  title?: string;
  originalTitle?: string | null;
  year?: number | null;
  score?: number | null;
  coverImage?: string | null;
  description?: string | null;
  externalSource?: string | null;
  externalId?: string | null;
  genres?: string[] | null;
  totalUnits?: number | null;
  unitName?: string | null;
  runtimeMinutes?: number | null;
  platforms?: string[] | null;
  developer?: string | null;
};

export const POOL_TYPES = ["movie", "series", "anime", "manga", "game"] as const;

export function parsePoolTypes(value: string | null): string[] {
  if (!value) return [...POOL_TYPES];
  const picked = value
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => (POOL_TYPES as readonly string[]).includes(t));
  return picked.length > 0 ? [...new Set(picked)] : [...POOL_TYPES];
}

function extractItems(payload: unknown): PoolItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as PoolItem[];
  const obj = payload as { items?: PoolItem[]; trending?: PoolItem[] };
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.trending)) return obj.trending;
  return [];
}

async function fetchPoolPage(
  endpoint: "trending" | "top" | "upcoming",
  type: string,
  pageSize: number,
): Promise<PoolItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/media/${endpoint}?type=${type}&pageSize=${pageSize}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) return [];
    return extractItems(await response.json().catch(() => null));
  } catch {
    return [];
  }
}

export function poolKey(item: PoolItem, index: number): string {
  if (typeof item.id === "number" && item.id > 0) return `id:${item.id}`;
  if (item.externalSource && item.externalId) {
    return `ext:${item.mediaType}:${item.externalSource}:${item.externalId}`;
  }
  return `row:${index}`;
}

// Merged trending + top per type. External providers first; the backend
// transparently falls back to the local catalog when one is unreachable.
export async function fetchCatalogPool(
  types: string[],
  pageSize = 20,
  includeUpcoming = false,
): Promise<PoolItem[]> {
  const pages = await Promise.all(
    types.flatMap((type) => [
      fetchPoolPage("trending", type, pageSize),
      fetchPoolPage("top", type, pageSize),
      ...(includeUpcoming ? [fetchPoolPage("upcoming", type, 10)] : []),
    ]),
  );

  const seen = new Set<string>();
  const pool: PoolItem[] = [];
  pages.flat().forEach((item, index) => {
    if (!item.title) return;
    const key = poolKey(item, index);
    if (seen.has(key)) return;
    seen.add(key);
    pool.push(item);
  });
  return pool;
}

// Fisher-Yates: uniform shuffle so every game deals a different order.
export function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
