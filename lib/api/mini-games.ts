import { authFetch, readApiError } from "@/lib/api/client";

export type MiniGamePoster = {
  id: number;
  mediaType: string;
  title: string;
  year?: number | null;
  score?: number | null;
  coverImage?: string | null;
  description?: string | null;
  externalSource?: string | null;
  externalId?: string | null;
  genres?: string[] | null;
};

export type MiniGameWallet = {
  balance: number;
  totalEarned: number;
};

export type LeaderboardEntry = {
  userId: number;
  username: string;
  avatarId?: string | null;
  bestScore: number;
  roundsWon: number;
  achievedAt: string;
};

export type MiniGameRoundPayload = {
  mediaId: number;
  attemptsUsed: number;
  hintsUsed: string[];
  points: number;
};

export async function fetchPosters(
  types: string[],
  count: number,
  exclude: number[],
): Promise<{ items: MiniGamePoster[]; poolSize: number } | null> {
  const params = new URLSearchParams();
  if (types.length > 0) params.set("types", types.join(","));
  params.set("count", String(count));
  if (exclude.length > 0) params.set("exclude", exclude.join(","));

  const response = await authFetch(`/api/mini-games/posters?${params.toString()}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    items?: MiniGamePoster[];
    poolSize?: number;
  } | null;
  if (!data || !Array.isArray(data.items)) return null;
  return {
    items: data.items.filter(
      (item) => item && typeof item.id === "number" && item.title && item.coverImage,
    ),
    poolSize: typeof data.poolSize === "number" ? data.poolSize : 0,
  };
}

export async function fetchWallet(): Promise<MiniGameWallet | null> {
  const response = await authFetch("/api/mini-games/wallet", { cache: "no-store" }).catch(
    () => null,
  );
  if (!response || !response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    balance?: number;
    totalEarned?: number;
  } | null;
  if (!data || typeof data.balance !== "number") return null;
  return {
    balance: data.balance,
    totalEarned: typeof data.totalEarned === "number" ? data.totalEarned : 0,
  };
}

export async function spendHint(
  hintType: string,
): Promise<{ ok: boolean; balance: number | null; message: string }> {
  const response = await authFetch("/api/mini-games/wallet/spend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hintType }),
  }).catch(() => null);
  if (!response) return { ok: false, balance: null, message: "Couldn't reach the server." };
  if (!response.ok) {
    return { ok: false, balance: null, message: await readApiError(response, "Couldn't buy the hint.") };
  }
  const data = (await response.json().catch(() => null)) as { balance?: number } | null;
  return {
    ok: true,
    balance: typeof data?.balance === "number" ? data.balance : null,
    message: "",
  };
}

export async function submitGame(payload: {
  game: string;
  scope: string[];
  rounds: MiniGameRoundPayload[];
}): Promise<{
  score: number;
  roundsWon: number;
  balance: number;
  totalEarned: number;
} | null> {
  const response = await authFetch("/api/mini-games/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    score?: number;
    roundsWon?: number;
    balance?: number;
    totalEarned?: number;
  } | null;
  if (!data || typeof data.score !== "number") return null;
  return {
    score: data.score,
    roundsWon: typeof data.roundsWon === "number" ? data.roundsWon : 0,
    balance: typeof data.balance === "number" ? data.balance : 0,
    totalEarned: typeof data.totalEarned === "number" ? data.totalEarned : 0,
  };
}

export async function fetchLeaderboard(
  game = "poster-guess",
  limit = 20,
): Promise<{ entries: LeaderboardEntry[]; mine: LeaderboardEntry | null } | null> {
  const response = await authFetch(
    `/api/mini-games/leaderboard?game=${encodeURIComponent(game)}&limit=${limit}`,
    { cache: "no-store" },
  ).catch(() => null);
  if (!response || !response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    entries?: LeaderboardEntry[];
    mine?: LeaderboardEntry | null;
  } | null;
  if (!data || !Array.isArray(data.entries)) return null;
  return { entries: data.entries, mine: data.mine ?? null };
}
