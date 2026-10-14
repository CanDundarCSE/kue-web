"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Coins, Eye, Flag, Lightbulb, RotateCcw, Type } from "lucide-react";

import SectionLabel from "@/app/features/home/section-label";
import {
  fetchPosters,
  fetchWallet,
  spendHint,
  submitGame,
  type MiniGamePoster,
  type MiniGameWallet,
} from "@/lib/api/mini-games";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const ROUNDS_PER_GAME = 5;
const START_POINTS = 100;
const DECAY_PER_WRONG = 20;
const POINTS_FLOOR = 10;
const MAX_GUESSES = 6;

// Small-canvas render widths per de-pixelation step. Step 5+ is full detail.
const PIXEL_WIDTHS = [12, 18, 28, 44, 72];
const FULL_DETAIL_LEVEL = PIXEL_WIDTHS.length;

const SCOPE_OPTIONS = [
  { id: "movie", label: "Film" },
  { id: "series", label: "Series" },
  { id: "game", label: "Game" },
  { id: "anime", label: "Anime" },
  { id: "manga", label: "Manga" },
] as const;

const HINT_DEFS = [
  { type: "year", label: "Year", price: 10, icon: CalendarDays },
  { type: "type", label: "Type", price: 15, icon: Type },
  { type: "firstLetter", label: "First letter", price: 25, icon: Lightbulb },
] as const;

type HintType = (typeof HINT_DEFS)[number]["type"];

function mediaTypeLabel(value: string): string {
  switch (value) {
    case "anime":
      return "Anime";
    case "series":
      return "Series";
    case "manga":
      return "Manga";
    case "game":
      return "Game";
    default:
      return "Film";
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the|a|an)\s+/, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(prev[j] + 1, next[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = next;
  }
  return prev[b.length];
}

function isCorrectGuess(guess: string, title: string): boolean {
  const g = normalize(guess);
  const t = normalize(title);
  if (!g || !t) return false;
  if (g === t) return true;
  return levenshtein(g, t) <= Math.max(2, Math.floor(t.length * 0.12));
}

function pointsAtStake(wrongs: number): number {
  return Math.max(START_POINTS - wrongs * DECAY_PER_WRONG, POINTS_FLOOR);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dw: number,
  dh: number,
  canvasW: number,
  canvasH: number,
) {
  const scale = Math.max(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (canvasW - w) / 2, (canvasH - h) / 2, w, h);
}

function drawPixelated(canvas: HTMLCanvasElement, img: HTMLImageElement, level: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.imageSmoothingEnabled = level >= FULL_DETAIL_LEVEL;

  if (level >= FULL_DETAIL_LEVEL) {
    ctx.clearRect(0, 0, W, H);
    drawCover(ctx, img, W, H, W, H);
    return;
  }

  const smallW = PIXEL_WIDTHS[Math.min(level, PIXEL_WIDTHS.length - 1)];
  const smallH = Math.max(1, Math.round((smallW * H) / W));
  const tiny = document.createElement("canvas");
  tiny.width = smallW;
  tiny.height = smallH;
  const tinyCtx = tiny.getContext("2d");
  if (!tinyCtx) return;
  drawCover(tinyCtx, img, smallW, smallH, smallW, smallH);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(tiny, 0, 0, smallW, smallH, 0, 0, W, H);
}

function PixelatedPoster({ src, level }: { src: string; level: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      drawPixelated(canvas, img, level);
      setLoadedSrc(src);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, level]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-line bg-surface-3">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Mystery poster"
        width={600}
        height={900}
        className="block h-auto w-full"
      />
      {loadedSrc !== src && (
        <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-3" />
      )}
    </div>
  );
}

type RoundResult = {
  mediaId: number;
  title: string;
  attemptsUsed: number;
  hintsUsed: string[];
  points: number;
  solved: boolean;
};

type Phase = "lobby" | "loading" | "playing" | "revealed" | "summary";

function hintValue(hint: HintType, poster: MiniGamePoster): string {
  switch (hint) {
    case "year":
      return poster.year ? String(poster.year) : "Unknown year";
    case "type":
      return mediaTypeLabel(poster.mediaType);
    case "firstLetter": {
      const first = poster.title.trim().charAt(0).toUpperCase();
      return first ? `"${first}…" (${poster.title.trim().length} letters)` : "—";
    }
  }
}

export default function PosterGame() {
  const { user, loading: authLoading } = useCurrentUser();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [scope, setScope] = useState<string[]>([]);
  const [posters, setPosters] = useState<MiniGamePoster[]>([]);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState<HintType[]>([]);
  const [hintBusy, setHintBusy] = useState<HintType | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [wallet, setWallet] = useState<MiniGameWallet | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [poolNote, setPoolNote] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const poster = posters[roundIndex] ?? null;
  const stake = pointsAtStake(wrongs);
  const singleTypeScope = scope.length === 1;
  const visibleHints = HINT_DEFS.filter(
    (hint) => !(hint.type === "type" && singleTypeScope),
  );

  // Wallet loads once the session resolves. Brand-new players start at
  // zero, which is exactly why hints stay locked on round one.
  useEffect(() => {
    if (authLoading || user === null) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      if (cancelled) return;
      void fetchWallet().then((next) => {
        if (!cancelled && next) setWallet(next);
      });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [user, authLoading]);

  const startGame = useCallback(
    async (nextScope: string[], exclude: number[]) => {
      setPhase("loading");
      setLoadError(false);
      setPoolNote(null);
      const dealt = await fetchPosters(nextScope, ROUNDS_PER_GAME, exclude);
      if (dealt === null) {
        setLoadError(true);
        setPhase("lobby");
        return;
      }
      if (dealt.items.length === 0) {
        setLoadError(true);
        setPhase("lobby");
        return;
      }
      if (dealt.poolSize > 0 && dealt.poolSize < ROUNDS_PER_GAME) {
        setPoolNote(`Small pool — only ${dealt.poolSize} posters to draw from.`);
      }
      setPosters(dealt.items);
      setSeenIds((prev) => [...prev, ...dealt.items.map((item) => item.id)]);
      setRoundIndex(0);
      setWrongs(0);
      setGuess("");
      setFeedback(null);
      setHintsUsed([]);
      setResults([]);
      submittedRef.current = false;
      setPhase("playing");
    },
    [],
  );

  const toggleScope = (id: string) => {
    setScope((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      return [...prev, id];
    });
  };

  const finishRound = (result: RoundResult) => {
    setResults((prev) => [...prev, result]);
    setPhase("revealed");
  };

  const handleGuess = (value: string) => {
    if (!poster || phase !== "playing") return;
    if (!value.trim()) return;
    if (isCorrectGuess(value, poster.title)) {
      finishRound({
        mediaId: poster.id,
        title: poster.title,
        attemptsUsed: wrongs + 1,
        hintsUsed: [...hintsUsed],
        points: pointsAtStake(wrongs),
        solved: true,
      });
      return;
    }
    const nextWrongs = wrongs + 1;
    if (nextWrongs >= MAX_GUESSES) {
      finishRound({
        mediaId: poster.id,
        title: poster.title,
        attemptsUsed: nextWrongs,
        hintsUsed: [...hintsUsed],
        points: 0,
        solved: false,
      });
      return;
    }
    setWrongs(nextWrongs);
    setGuess("");
    setFeedback(
      `Not quite — the poster clears a little. ${pointsAtStake(nextWrongs)} pts left on this one.`,
    );
  };

  const buyHint = async (hint: HintType) => {
    if (!poster || phase !== "playing" || hintsUsed.includes(hint) || hintBusy) return;
    setHintBusy(hint);
    const result = await spendHint(hint);
    setHintBusy(null);
    if (!result.ok) {
      setFeedback(result.message || "Couldn't buy the hint.");
      return;
    }
    if (result.balance !== null) {
      setWallet((prev) =>
        prev ? { ...prev, balance: result.balance as number } : prev,
      );
    }
    setHintsUsed((prev) => [...prev, hint]);
    setFeedback(null);
  };

  const giveUp = () => {
    if (!poster || phase !== "playing") return;
    finishRound({
      mediaId: poster.id,
      title: poster.title,
      attemptsUsed: wrongs,
      hintsUsed: [...hintsUsed],
      points: 0,
      solved: false,
    });
  };

  const nextRound = () => {
    if (roundIndex + 1 >= posters.length) {
      setPhase("summary");
      return;
    }
    setRoundIndex((i) => i + 1);
    setWrongs(0);
    setGuess("");
    setFeedback(null);
    setHintsUsed([]);
    setPhase("playing");
  };

  // Submit once when the summary lands: credits the wallet and stores the
  // leaderboard row in a single server-validated call.
  useEffect(() => {
    if (phase !== "summary" || submittedRef.current) return;
    submittedRef.current = true;
    void submitGame({
      game: "poster-guess",
      scope: scope.length > 0 ? scope : ["movie", "series", "game", "anime", "manga"],
      rounds: results.map((r) => ({
        mediaId: r.mediaId,
        attemptsUsed: Math.max(1, r.attemptsUsed),
        hintsUsed: r.hintsUsed,
        points: r.points,
      })),
    }).then((next) => {
      if (next) setWallet({ balance: next.balance, totalEarned: next.totalEarned });
    });
  }, [phase, results, scope]);

  const total = results.reduce((sum, r) => sum + r.points, 0);

  if (phase === "lobby" || phase === "loading") {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Poster guess</SectionLabel>
        <span className="mt-4 block text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          Pick your pool
        </span>
        <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
          What are you guessing today?
        </h3>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-2">
          Five random posters, 100 pts each. Every miss clears the pixels a
          little — but costs you 20 pts. Spend earned points on hints.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setScope([])}
            aria-pressed={scope.length === 0}
            className={cn(
              "rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              scope.length === 0
                ? "bg-foreground font-semibold text-background"
                : "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
            )}
          >
            All media
          </button>
          {SCOPE_OPTIONS.map((option) => {
            const active = scope.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleScope(option.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  active
                    ? "bg-foreground font-semibold text-background"
                    : "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void startGame(scope, seenIds)}
            disabled={phase === "loading"}
            className={cn(
              "rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background transition-opacity",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {phase === "loading" ? "Dealing posters…" : "Start game"}
          </button>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
            <Coins className="size-3.5 text-accent" />
            {wallet ? `${wallet.balance} pts` : "…"}
          </span>
        </div>

        {loadError && (
          <p className="mt-4 text-[13px] text-ink-2">
            Couldn&rsquo;t deal the posters. Check your connection and try again.
          </p>
        )}
      </article>
    );
  }

  if (phase === "summary") {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Poster guess — results</SectionLabel>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
              Total score
            </span>
            <p className="mt-2 font-serif text-[44px] leading-none tracking-[-0.01em] text-foreground">
              {total}
              <span className="text-ink-3"> pts</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
            <Coins className="size-3.5 text-accent" />
            {wallet ? `${wallet.balance} in wallet` : "…"}
          </span>
        </div>

        <ul className="mt-4 flex flex-col">
          {results.map((result, index) => (
            <li
              key={`${result.mediaId}-${index}`}
              className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
            >
              <span className="w-5 shrink-0 font-mono text-[12px] tabular-nums text-ink-3">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-foreground">
                  {result.title}
                </p>
                <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
                  {result.solved
                    ? `${result.attemptsUsed} ${result.attemptsUsed === 1 ? "try" : "tries"}`
                    : "Unsolved"}
                  {result.hintsUsed.length > 0 && ` · ${result.hintsUsed.length} hints`}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-[13px] tabular-nums",
                  result.points > 0 ? "text-accent" : "text-ink-3",
                )}
              >
                +{result.points}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void startGame(scope, seenIds)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            <RotateCcw className="size-3.5" />
            Play again
          </button>
          <button
            type="button"
            onClick={() => setPhase("lobby")}
            className={cn(
              "rounded-lg border border-line-2/70 px-4 py-2 text-[13px] font-semibold text-ink-2",
              "transition-colors hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            Change pool
          </button>
        </div>
        {poolNote && <p className="mt-3 text-[12px] text-ink-3">{poolNote}</p>}
      </article>
    );
  }

  if (!poster) return null;

  const lastResult = phase === "revealed" ? results[results.length - 1] : null;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>
        Round {roundIndex + 1} of {posters.length}
      </SectionLabel>

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,380px)_1fr]">
        <div>
          <PixelatedPoster
            src={poster.coverImage as string}
            level={phase === "revealed" ? FULL_DETAIL_LEVEL : wrongs}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">
              {phase === "revealed" ? "Revealed" : `Attempt ${Math.min(wrongs + 1, MAX_GUESSES)} of ${MAX_GUESSES}`}
            </span>
            <span className="font-mono text-[12px] tabular-nums text-accent">
              {phase === "revealed" && lastResult ? `+${lastResult.points}` : `${stake} pts at stake`}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={phase === "revealed" ? 100 : Math.round((wrongs / FULL_DETAIL_LEVEL) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Poster clarity"
            className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{
                width: `${phase === "revealed" ? 100 : Math.round((wrongs / FULL_DETAIL_LEVEL) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
            Name this title
          </span>

          {phase === "revealed" && lastResult ? (
            <div className="mt-3">
              <h3 className="font-serif text-2xl leading-tight text-foreground">
                {lastResult.solved ? "Got it." : "Out of tries."}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                It was <span className="font-semibold text-foreground">{poster.title}</span>
                {poster.year ? ` (${poster.year})` : ""} — {mediaTypeLabel(poster.mediaType)}.
              </p>
              <button
                type="button"
                onClick={nextRound}
                autoFocus
                className={cn(
                  "mt-4 rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background",
                  "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                )}
              >
                {roundIndex + 1 >= posters.length ? "See results" : "Next poster"}
              </button>
            </div>
          ) : (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleGuess(guess);
              }}
            >
              <label htmlFor="poster-guess" className="sr-only">
                Your guess
              </label>
              <input
                id="poster-guess"
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type the title…"
                autoComplete="off"
                className={cn(
                  "h-12 w-full rounded-xl border border-line bg-surface-2 px-4",
                  "text-[14px] text-foreground placeholder:text-ink-3",
                  "transition-colors duration-150 motion-reduce:transition-none",
                  "hover:border-line-2",
                  "focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none",
                )}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={!guess.trim()}
                  className={cn(
                    "rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background",
                    "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  Guess
                </button>
                <button
                  type="button"
                  onClick={giveUp}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border border-line-2/70 px-4 py-2 text-[13px] font-semibold text-ink-2",
                    "transition-colors hover:bg-surface-3 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  )}
                >
                  <Flag className="size-3.5" />
                  Give up
                </button>
              </div>
            </form>
          )}

          {feedback && phase === "playing" && (
            <p role="status" className="mt-3 text-[13px] leading-relaxed text-ink-2">
              {feedback}
            </p>
          )}

          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                Hints
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
                <Coins className="size-3.5 text-accent" />
                {wallet ? `${wallet.balance} pts` : "…"}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {visibleHints.map((hint) => {
                const bought = hintsUsed.includes(hint.type);
                const affordable = (wallet?.balance ?? 0) >= hint.price;
                const Icon = hint.icon;
                return (
                  <div key={hint.type}>
                    <button
                      type="button"
                      onClick={() => void buyHint(hint.type)}
                      disabled={bought || !affordable || hintBusy !== null || phase !== "playing"}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                        bought
                          ? "border-transparent bg-transparent text-ink-2"
                          : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                        "disabled:pointer-events-none",
                        !bought && !affordable && "opacity-50",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 font-medium">
                        {bought ? hintValue(hint.type, poster) : `Reveal ${hint.label.toLowerCase()}`}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-ink-3">
                        {bought ? "owned" : hintBusy === hint.type ? "…" : `−${hint.price}`}
                      </span>
                    </button>
                  </div>
                );
              })}
              {!wallet || wallet.balance === 0 ? (
                <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
                  <Eye className="size-3.5" />
                  {hintsUsed.length === 0
                    ? "Solve posters to earn hint points."
                    : "Out of points — solve this one to earn more."}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
