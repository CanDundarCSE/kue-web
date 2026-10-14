import { NO_STORE } from "@/lib/api/auth";
import {
  fetchCatalogPool,
  parsePoolTypes,
  poolKey,
  shuffle,
  type PoolItem,
} from "../pool";

function parseExclude(value: string | null): Set<number> {
  const ids = new Set<number>();
  if (!value) return ids;
  for (const part of value.split(",")) {
    const id = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(id) && id > 0) ids.add(id);
  }
  return ids;
}

// Poster pool for the guessing game. External providers first (trending +
// top per selected type); the backend transparently falls back to the local
// catalog when a provider is unreachable, so this stays up either way.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const types = parsePoolTypes(searchParams.get("types"));
  const count = Math.min(10, Math.max(1, parseInt(searchParams.get("count") ?? "5", 10) || 5));
  const exclude = parseExclude(searchParams.get("exclude"));

  const catalog = await fetchCatalogPool(types);

  const seen = new Set<string>();
  const pool: PoolItem[] = [];
  catalog.forEach((item, index) => {
    if (!item.coverImage || !item.title) return;
    if (typeof item.id === "number" && item.id > 0 && exclude.has(item.id)) return;
    const key = poolKey(item, index);
    if (seen.has(key)) return;
    seen.add(key);
    pool.push(item);
  });

  const items = shuffle(pool).slice(0, count);
  return Response.json({ items, poolSize: pool.length }, { headers: NO_STORE });
}
