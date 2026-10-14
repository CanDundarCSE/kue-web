import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

type PosterItem = {
  id?: number;
  mediaType?: string;
  title?: string;
  year?: number | null;
  score?: number | null;
  coverImage?: string | null;
  description?: string | null;
  externalSource?: string | null;
  externalId?: string | null;
  genres?: string[] | null;
};

const POSTER_TYPES = ["movie", "series", "anime", "manga", "game"] as const;

function parseTypes(value: string | null): string[] {
  if (!value) return [...POSTER_TYPES];
  const picked = value
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => (POSTER_TYPES as readonly string[]).includes(t));
  return picked.length > 0 ? [...new Set(picked)] : [...POSTER_TYPES];
}

function parseExclude(value: string | null): Set<number> {
  const ids = new Set<number>();
  if (!value) return ids;
  for (const part of value.split(",")) {
    const id = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(id) && id > 0) ids.add(id);
  }
  return ids;
}

function posterKey(item: PosterItem, index: number): string {
  if (typeof item.id === "number" && item.id > 0) return `id:${item.id}`;
  if (item.externalSource && item.externalId) {
    return `ext:${item.mediaType}:${item.externalSource}:${item.externalId}`;
  }
  return `row:${index}`;
}

function extractItems(payload: unknown): PosterItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as PosterItem[];
  const obj = payload as { items?: PosterItem[] };
  return Array.isArray(obj.items) ? obj.items : [];
}

async function fetchPoolPage(
  endpoint: "trending" | "top",
  type: string,
  pageSize: number,
): Promise<PosterItem[]> {
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

// Fisher-Yates: uniform shuffle so every game deals a different order.
function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Poster pool for the guessing game. External providers first (trending +
// top per selected type); the backend transparently falls back to the local
// catalog when a provider is unreachable, so this stays up either way.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const types = parseTypes(searchParams.get("types"));
  const count = Math.min(10, Math.max(1, parseInt(searchParams.get("count") ?? "5", 10) || 5));
  const exclude = parseExclude(searchParams.get("exclude"));

  const pages = await Promise.all(
    types.flatMap((type) => [
      fetchPoolPage("trending", type, 20),
      fetchPoolPage("top", type, 20),
    ]),
  );

  const seen = new Set<string>();
  const pool: PosterItem[] = [];
  pages.flat().forEach((item, index) => {
    if (!item.coverImage || !item.title) return;
    if (typeof item.id === "number" && item.id > 0 && exclude.has(item.id)) return;
    const key = posterKey(item, index);
    if (seen.has(key)) return;
    seen.add(key);
    pool.push(item);
  });

  const items = shuffle(pool).slice(0, count);
  return Response.json({ items, poolSize: pool.length }, { headers: NO_STORE });
}
