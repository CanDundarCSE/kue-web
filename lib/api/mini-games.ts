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
  totalScore: number;
  bestScore: number;
  gamesPlayed: number;
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

export type DuelSide = MiniGamePoster;

export type DuelPair = {
  a: DuelSide;
  b: DuelSide;
};

export async function fetchDuels(
  types: string[],
  count: number,
  excludeMedia: number[] = [],
): Promise<{ pairs: DuelPair[]; poolSize: number } | null> {
  const params = new URLSearchParams();
  if (types.length > 0) params.set("types", types.join(","));
  params.set("count", String(count));
  if (excludeMedia.length > 0) params.set("excludeMedia", excludeMedia.join(","));

  const response = await authFetch(`/api/mini-games/duels?${params.toString()}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    pairs?: DuelPair[];
    poolSize?: number;
  } | null;
  if (!data || !Array.isArray(data.pairs) || data.pairs.length === 0) return null;
  const pairs = data.pairs.filter(
    (pair) =>
      pair?.a?.title &&
      pair?.b?.title &&
      typeof pair.a.score === "number" &&
      typeof pair.b.score === "number" &&
      Math.abs(pair.a.score - pair.b.score) >= 0.5,
  );
  if (pairs.length === 0) return null;
  return {
    pairs,
    poolSize: typeof data.poolSize === "number" ? data.poolSize : 0,
  };
}

export type QuizPoster = {
  image?: string | null;
  title: string;
  mediaType: string;
  year?: number | null;
};

export type QuizQuestion = {
  id: string;
  kind: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  mediaId: number | null;
  source: "trivia" | "catalog";
  posters: QuizPoster[];
};

export async function fetchQuiz(
  types: string[],
  count: number,
  excludeQ: string[],
  excludeMedia: number[] = [],
): Promise<{ questions: QuizQuestion[]; poolSize: number } | null> {
  const params = new URLSearchParams();
  if (types.length > 0) params.set("types", types.join(","));
  params.set("count", String(count));
  if (excludeQ.length > 0) params.set("excludeQ", excludeQ.join(","));
  if (excludeMedia.length > 0) params.set("excludeMedia", excludeMedia.join(","));

  const response = await authFetch(`/api/mini-games/quiz?${params.toString()}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    questions?: QuizQuestion[];
    poolSize?: number;
  } | null;
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) return null;
  return {
    questions: data.questions.filter(
      (q) =>
        q &&
        typeof q.prompt === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.answerIndex === "number" &&
        q.answerIndex >= 0 &&
        q.answerIndex < q.options.length,
    ),
    poolSize: typeof data.poolSize === "number" ? data.poolSize : 0,
  };
}
