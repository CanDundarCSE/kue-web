import { NO_STORE } from "@/lib/api/auth";
import {
  fetchCatalogPool,
  parsePoolTypes,
  shuffle,
  type PoolItem,
} from "../pool";

export type QuizQuestion = {
  id: string;
  kind: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  mediaId: number | null;
  source: "trivia" | "catalog";
  posters: { image?: string | null; title: string; mediaType: string; year?: number | null }[];
};

const TYPE_LABELS: Record<string, string> = {
  movie: "Film",
  series: "Series",
  game: "Game",
  anime: "Anime",
  manga: "Manga",
};

// OpenTDB categories per media type (manga shares anime's category).
const TRIVIA_CATEGORIES: Record<string, number> = {
  movie: 11,
  series: 14,
  game: 15,
  anime: 31,
  manga: 31,
};

// ---------------------------------------------------------------------------
// OpenTDB (external trivia, primary source)
// ---------------------------------------------------------------------------

type OpenTDBItem = {
  type?: string;
  difficulty?: string;
  question?: string;
  correct_answer?: string;
  incorrect_answers?: string[];
};

type CachedTrivia = { at: number; items: OpenTDBItem[] };
const TRIVIA_TTL_MS = 10 * 60 * 1000;
const triviaCache = new Map<number, CachedTrivia>();

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    quot: '"',
    amp: "&",
    lt: "<",
    gt: ">",
    nbsp: " ",
    eacute: "é",
    egrave: "è",
    uuml: "ü",
    auml: "ä",
    ouml: "ö",
    copy: "©",
    mdash: "—",
    ndash: "–",
    hellip: "…",
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => named[name] ?? match);
}

function hashQuestion(value: string): string {
  let hash = 5381;
  const text = value.toLowerCase().trim();
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return `t-${hash.toString(36)}`;
}

async function fetchTriviaCategory(category: number, amount: number): Promise<OpenTDBItem[]> {
  const cached = triviaCache.get(category);
  if (cached && Date.now() - cached.at < TRIVIA_TTL_MS && cached.items.length >= amount) {
    return cached.items.slice(0, Math.max(amount, 10));
  }
  try {
    const response = await fetch(
      `https://opentdb.com/api.php?amount=${amount}&category=${category}&type=multiple`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) return cached?.items ?? [];
    const data = (await response.json().catch(() => null)) as {
      response_code?: number;
      results?: OpenTDBItem[];
    } | null;
    if (!data || data.response_code !== 0 || !Array.isArray(data.results)) {
      return cached?.items ?? [];
    }
    const items = data.results.filter(
      (item) =>
        item &&
        typeof item.question === "string" &&
        typeof item.correct_answer === "string" &&
        Array.isArray(item.incorrect_answers) &&
        item.incorrect_answers.length === 3,
    );
    triviaCache.set(category, { at: Date.now(), items });
    return items;
  } catch {
    return cached?.items ?? [];
  }
}

function toTriviaQuestion(item: OpenTDBItem): QuizQuestion | null {
  const prompt = decodeEntities(item.question ?? "").trim();
  const correct = decodeEntities(item.correct_answer ?? "").trim();
  const wrong = (item.incorrect_answers ?? []).map((a) => decodeEntities(a).trim());
  if (!prompt || !correct || wrong.length !== 3 || wrong.some((w) => !w)) return null;
  const options = shuffle([correct, ...wrong]);
  return {
    id: hashQuestion(prompt),
    kind: "trivia",
    prompt,
    options,
    answerIndex: options.indexOf(correct),
    mediaId: null,
    source: "trivia",
    posters: [],
  };
}

// ---------------------------------------------------------------------------
// Generated questions (catalog pool + user's library, fallback source)
// ---------------------------------------------------------------------------

function sample<T>(list: T[], n: number): T[] {
  return shuffle(list).slice(0, n);
}

function uniqueNumbers(candidates: number[], exclude: number, n: number): number[] {
  const out: number[] = [];
  for (const value of candidates) {
    if (value !== exclude && value > 0 && !out.includes(value) && out.length < n) {
      out.push(value);
    }
  }
  return out;
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function posterOf(item: PoolItem) {
  return {
    image: item.coverImage ?? null,
    title: item.title ?? "Untitled",
    mediaType: item.mediaType ?? "movie",
    year: item.year ?? null,
  };
}

function yearQuestion(item: PoolItem): QuizQuestion | null {
  const year = item.year;
  if (typeof year !== "number" || !item.title) return null;
  const others = uniqueNumbers([year - 1, year + 1, year - 2, year + 2, year - 5, year + 5], year, 3);
  if (others.length < 3) return null;
  const options = [...others, year].sort((a, b) => a - b).map(String);
  return {
    id: `g-year-${item.id ?? item.title}`,
    kind: "year",
    prompt: `Which year was ${item.title} released?`,
    options,
    answerIndex: options.indexOf(String(year)),
    mediaId: typeof item.id === "number" ? item.id : null,
    source: "catalog",
    posters: [posterOf(item)],
  };
}

function genreQuestion(item: PoolItem, genrePool: string[]): QuizQuestion | null {
  const correct = item.genres?.[0];
  if (!correct || !item.title) return null;
  const others = sample(
    genrePool.filter((g) => g.toLowerCase() !== correct.toLowerCase()),
    3,
  );
  if (others.length < 3) return null;
  const options = shuffle([correct, ...others]);
  return {
    id: `g-genre-${item.id ?? item.title}`,
    kind: "genre",
    prompt: `Which genre fits ${item.title} best?`,
    options,
    answerIndex: options.indexOf(correct),
    mediaId: typeof item.id === "number" ? item.id : null,
    source: "catalog",
    posters: [posterOf(item)],
  };
}

function mediaTypeQuestion(item: PoolItem): QuizQuestion | null {
  const correct = TYPE_LABELS[item.mediaType ?? ""];
  if (!correct || !item.title) return null;
  const others = sample(
    Object.values(TYPE_LABELS).filter((label) => label !== correct),
    3,
  );
  const options = shuffle([correct, ...others]);
  return {
    id: `g-type-${item.id ?? item.title}`,
    kind: "mediatype",
    prompt: `${item.title} is a…?`,
    options,
    answerIndex: options.indexOf(correct),
    mediaId: typeof item.id === "number" ? item.id : null,
    source: "catalog",
    posters: [posterOf(item)],
  };
}

function unitsQuestion(item: PoolItem): QuizQuestion | null {
  const total = item.totalUnits;
  const type = item.mediaType ?? "";
  if (typeof total !== "number" || total <= 1 || !item.title) return null;
  if (type !== "anime" && type !== "series" && type !== "manga") return null;
  const unit = type === "manga" ? "chapters" : "episodes";
  const others = uniqueNumbers([total - 2, total + 2, total - 5, total + 5, total + 10], total, 3);
  if (others.length < 3) return null;
  const options = [...others, total].sort((a, b) => a - b).map(String);
  return {
    id: `g-units-${item.id ?? item.title}`,
    kind: "units",
    prompt: `How many ${unit} does ${item.title} have?`,
    options,
    answerIndex: options.indexOf(String(total)),
    mediaId: typeof item.id === "number" ? item.id : null,
    source: "catalog",
    posters: [posterOf(item)],
  };
}

function developerQuestion(item: PoolItem, devPool: string[]): QuizQuestion | null {
  const correct = item.developer?.trim();
  if (!correct || !item.title) return null;
  const others = sample(devPool.filter((d) => d.toLowerCase() !== correct.toLowerCase()), 3);
  if (others.length < 3) return null;
  const options = shuffle([correct, ...others]);
  return {
    id: `g-dev-${item.id ?? item.title}`,
    kind: "developer",
    prompt: `Who developed ${item.title}?`,
    options,
    answerIndex: options.indexOf(correct),
    mediaId: typeof item.id === "number" ? item.id : null,
    source: "catalog",
    posters: [posterOf(item)],
  };
}

function runtimeQuestion(item: PoolItem): QuizQuestion | null {
  const runtime = item.runtimeMinutes;
  if (typeof runtime !== "number" || runtime <= 0 || !item.title) return null;
  if ((item.mediaType ?? "") !== "movie") return null;
  const others = uniqueNumbers(
    [runtime - 20, runtime + 20, runtime - 45, runtime + 45, runtime + 70],
    runtime,
    3,
  );
  if (others.length < 3) return null;
  const options = [...others, runtime].sort((a, b) => a - b).map(formatRuntime);
  return {
    id: `g-runtime-${item.id ?? item.title}`,
    kind: "runtime",
    prompt: `Roughly how long is ${item.title}?`,
    options,
    answerIndex: options.indexOf(formatRuntime(runtime)),
    mediaId: typeof item.id === "number" ? item.id : null,
    source: "catalog",
    posters: [posterOf(item)],
  };
}

function topScoreQuestion(items: PoolItem[]): QuizQuestion | null {
  const scored = items.filter(
    (item) => typeof item.score === "number" && item.title,
  );
  if (scored.length < 4) return null;
  const picked = sample(scored, 4);
  let best = picked[0];
  for (const item of picked) {
    if ((item.score ?? 0) > (best.score ?? 0)) best = item;
  }
  const options = shuffle(picked.map((item) => item.title as string));
  // Sorted key parts so the same set always maps to the same id —
  // exclusion must catch it regardless of draw order.
  const key = picked
    .map((i) => `${i.id ?? i.title}`)
    .sort()
    .join("-");
  return {
    id: `g-top-${key}`,
    kind: "topScore",
    prompt: "Which of these scored highest?",
    options,
    answerIndex: options.indexOf(best.title as string),
    mediaId: null,
    source: "catalog",
    posters: picked.map(posterOf),
  };
}

function duelQuestion(a: PoolItem, b: PoolItem): QuizQuestion | null {
  if (
    typeof a.score !== "number" ||
    typeof b.score !== "number" ||
    !a.title ||
    !b.title ||
    Math.abs(a.score - b.score) < 0.05
  ) {
    return null;
  }
  const winner = (a.score ?? 0) > (b.score ?? 0) ? a : b;
  const options = shuffle([a.title, b.title]);
  const key = [`${a.id ?? a.title}`, `${b.id ?? b.title}`].sort().join("-");
  return {
    id: `g-duel-${key}`,
    kind: "duel",
    prompt: "Which scores higher?",
    options,
    answerIndex: options.indexOf(winner.title as string),
    mediaId: null,
    source: "catalog",
    posters: [posterOf(a), posterOf(b)],
  };
}

// ---------------------------------------------------------------------------
// Route: hybrid assembly — OpenTDB primary, generated fill + full fallback
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const types = parsePoolTypes(searchParams.get("types"));
  const count = Math.min(20, Math.max(5, parseInt(searchParams.get("count") ?? "10", 10) || 10));
  const excludeQ = new Set(
    (searchParams.get("excludeQ") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const triviaTarget = Math.round(count * 0.6);
  const categories = [...new Set(types.map((t) => TRIVIA_CATEGORIES[t]).filter(Boolean))];
  // Deep cache: back-to-back games must stay fresh, so each category holds
  // several games' worth (OpenTDB allows up to 50 per request).
  const triviaAmount =
    categories.length > 0
      ? Math.min(50, Math.max(Math.ceil(triviaTarget / categories.length) * 4, 20))
      : 0;
  const excludeMedia = new Set(
    (searchParams.get("excludeMedia") ?? "")
      .split(",")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0),
  );

  const catalog = await fetchCatalogPool(types, 20, true);

  // OpenTDB leg (external, primary).
  let trivia: QuizQuestion[] = [];
  if (triviaAmount > 0) {
    const legs = await Promise.all(
      categories.map((category) => fetchTriviaCategory(category, triviaAmount)),
    );
    trivia = legs
      .flat()
      .map(toTriviaQuestion)
      .filter((q): q is QuizQuestion => q !== null)
      .filter((q) => !excludeQ.has(q.id));
    trivia = shuffle(trivia).slice(0, triviaTarget);
  }

  // Generated leg: catalog builders round-robin.
  const needed = count - trivia.length;
  const generated: QuizQuestion[] = [];
  const usedIds = new Set<string>(excludeQ);

  const push = (q: QuizQuestion | null) => {
    if (q && !usedIds.has(q.id)) {
      usedIds.add(q.id);
      generated.push(q);
    }
  };

  if (generated.length < needed && catalog.length > 0) {
    // Subject-level exclusion: last game's titles sit out this game so the
    // same subjects stop recurring back-to-back as different question
    // kinds. Falls back to the full pool when that would starve the game.
    const freshPool = catalog.filter(
      (item) => typeof item.id !== "number" || !excludeMedia.has(item.id),
    );
    const usePool = freshPool.length >= 8 ? freshPool : catalog;
    const genrePool = [...new Set(usePool.flatMap((item) => item.genres ?? []))];
    const devPool = [
      ...new Set(
        usePool.map((item) => item.developer?.trim() ?? "").filter((d) => d.length > 0),
      ),
    ];
    const shuffledPool = shuffle(usePool);
    // Rotated per request so consecutive games don't lead with the same
    // question kinds.
    const builders: ((item: PoolItem) => QuizQuestion | null)[] = shuffle([
      yearQuestion,
      (item) => genreQuestion(item, genrePool),
      mediaTypeQuestion,
      unitsQuestion,
      (item) => developerQuestion(item, devPool),
      runtimeQuestion,
    ]);
    let rounds = 0;
    while (generated.length < needed && rounds < shuffledPool.length * 2 + 4) {
      const item = shuffledPool[rounds % shuffledPool.length];
      if (rounds % 7 === 6) {
        push(topScoreQuestion(shuffledPool));
      } else if (rounds % 7 === 5) {
        const other = shuffledPool[(rounds + 3) % shuffledPool.length];
        if (other !== item) push(duelQuestion(item, other));
      } else {
        push(builders[rounds % builders.length](item));
      }
      rounds++;
    }
  }

  const questions = shuffle([...trivia, ...generated]).slice(0, count);

  // Below a playable minimum the client shows retry instead of a stub game.
  if (questions.length < 5) {
    return Response.json(
      { message: "Not enough questions available right now." },
      { status: 502, headers: NO_STORE },
    );
  }

  return Response.json(
    {
      questions,
      mix: {
        trivia: questions.filter((q) => q.source === "trivia").length,
        generated: questions.filter((q) => q.source !== "trivia").length,
      },
      poolSize: catalog.length,
    },
    { headers: NO_STORE },
  );
}
