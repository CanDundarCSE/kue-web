import { NO_STORE } from "@/lib/api/auth";
import {
  fetchCatalogPool,
  parsePoolTypes,
  poolKey,
  shuffle,
} from "../pool";

export type SprintRound = {
  media: {
    id: number | null;
    mediaType: string;
    title: string;
    year?: number | null;
    coverImage?: string | null;
  };
  options: string[];
  answerIndex: number;
};

function parseExcludeMedia(value: string | null): Set<number> {
  const ids = new Set<number>();
  if (!value) return ids;
  for (const part of value.split(",")) {
    const id = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(id) && id > 0) ids.add(id);
  }
  return ids;
}

// Timed genre rounds: one poster, four genres. Titles stay server-side only
// as data — the client hides them until reveal, so recognition comes from
// the artwork alone.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const types = parsePoolTypes(searchParams.get("types"));
  const count = Math.min(20, Math.max(1, parseInt(searchParams.get("count") ?? "10", 10) || 10));
  const excludeMedia = parseExcludeMedia(searchParams.get("excludeMedia"));

  const catalog = await fetchCatalogPool(types);

  const seen = new Set<string>();
  const eligible = catalog.filter((item, index) => {
    if (!item.coverImage || !item.title || !item.genres?.[0]) return false;
    if (typeof item.id === "number" && item.id > 0 && excludeMedia.has(item.id)) return false;
    const key = poolKey(item, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Fallback to the full eligible pool when exclusion would starve the game.
  const pool =
    eligible.length >= 8
      ? eligible
      : catalog.filter((item) => item.coverImage && item.title && item.genres?.[0]);

  const genrePool = [...new Set(pool.flatMap((item) => item.genres ?? []))];
  const rounds: SprintRound[] = [];
  const usedMedia = new Set<number | string>();

  for (const item of shuffle(pool)) {
    if (rounds.length >= count) break;
    const mediaKey = typeof item.id === "number" && item.id > 0 ? item.id : (item.title as string);
    if (usedMedia.has(mediaKey)) continue;
    const correct = (item.genres as string[])[0];
    const others = shuffle(
      genrePool.filter((g) => g.toLowerCase() !== correct.toLowerCase()),
    ).slice(0, 3);
    if (others.length < 3) continue;
    usedMedia.add(mediaKey);
    const options = shuffle([correct, ...others]);
    rounds.push({
      media: {
        id: typeof item.id === "number" ? item.id : null,
        mediaType: item.mediaType ?? "movie",
        title: item.title as string,
        year: item.year ?? null,
        coverImage: item.coverImage ?? null,
      },
      options,
      answerIndex: options.indexOf(correct),
    });
  }

  // Below a playable minimum the client shows retry instead of a stub game.
  if (rounds.length < 5) {
    return Response.json(
      { message: "Not enough genre titles available right now." },
      { status: 502, headers: NO_STORE },
    );
  }

  return Response.json({ rounds, poolSize: pool.length }, { headers: NO_STORE });
}
