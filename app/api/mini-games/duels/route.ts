import { NO_STORE } from "@/lib/api/auth";
import {
  fetchCatalogPool,
  parsePoolTypes,
  poolKey,
  shuffle,
  type PoolItem,
} from "../pool";

export type DuelPair = { a: PoolItem; b: PoolItem };

const MIN_SCORE_GAP = 0.5;

function parseExcludeMedia(value: string | null): Set<number> {
  const ids = new Set<number>();
  if (!value) return ids;
  for (const part of value.split(",")) {
    const id = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(id) && id > 0) ids.add(id);
  }
  return ids;
}

// Score-duel pairs for the higher-or-lower game. Both sides must have a
// score with a clear gap — ties can't be judged fairly, so they're skipped.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const types = parsePoolTypes(searchParams.get("types"));
  const count = Math.min(20, Math.max(1, parseInt(searchParams.get("count") ?? "8", 10) || 8));
  const excludeMedia = parseExcludeMedia(searchParams.get("excludeMedia"));

  const catalog = await fetchCatalogPool(types);

  const seen = new Set<string>();
  const scored = catalog.filter((item, index) => {
    if (typeof item.score !== "number" || !item.title || !item.coverImage) return false;
    if (typeof item.id === "number" && item.id > 0 && excludeMedia.has(item.id)) return false;
    const key = poolKey(item, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const pairs: DuelPair[] = [];
  const shuffled = shuffle(scored);
  for (let i = 0; i + 1 < shuffled.length && pairs.length < count; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    if (Math.abs((a.score ?? 0) - (b.score ?? 0)) < MIN_SCORE_GAP) continue;
    pairs.push({ a, b });
  }

  // Below a playable minimum the client shows retry instead of a stub game.
  if (pairs.length < 3) {
    return Response.json(
      { message: "Not enough scored titles for duels right now." },
      { status: 502, headers: NO_STORE },
    );
  }

  return Response.json({ pairs, poolSize: scored.length }, { headers: NO_STORE });
}
