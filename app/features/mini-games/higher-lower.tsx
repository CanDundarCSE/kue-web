"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Coins, Flame, RotateCcw, X } from "lucide-react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import SectionLabel from "@/app/features/home/section-label";
import ScopePicker from "@/app/features/mini-games/scope-picker";
import {
  fetchDuels,
  fetchWallet,
  submitGame,
  type DuelPair,
  type DuelSide,
  type MiniGameWallet,
} from "@/lib/api/mini-games";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const DUELS_PER_GAME = 8;
const BASE_POINTS = 10;

// Streak pays 10 → 20 → 40 → 80 → 100 (capped: the score submission
// endpoint rejects rounds over 100).
function streakPoints(streak: number): number {
  return Math.min(BASE_POINTS * 2 ** Math.max(0, streak - 1), 100);
}

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

function asMediaType(value: string): MediaType {
  return MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

type DuelResult = {
  mediaId: number;
  correct: boolean;
  points: number;
  streakAfter: number;
  aTitle: string;
  bTitle: string;
  aScore: number;
  bScore: number;
};

type Phase = "lobby" | "loading" | "playing" | "revealed" | "summary";

function DuelCard({
  side,
  revealed,
  dimmed,
  won,
  lost,
  disabled,
  onPick,
}: {
  side: DuelSide;
  revealed: boolean;
  dimmed: boolean;
  won: boolean;
  lost: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        "rounded-xl border bg-surface-2 p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        won
          ? "border-accent/60 bg-accent/10"
          : lost
            ? "border-red-400/50"
            : "border-line hover:border-line-2",
        (dimmed || disabled) && !won && !lost && "opacity-70",
        disabled && "disabled:pointer-events-none",
      )}
    >
      <MediaAvatarCard
        title={side.title}
        year={side.year ?? undefined}
        image={side.coverImage ?? undefined}
        type={asMediaType(side.mediaType)}
        size="fluid"
      />
      <p className="mt-2 truncate text-[13px] font-semibold text-foreground">
        {side.title}
      </p>
      <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
        {side.year ?? "—"}
      </p>
      {revealed && typeof side.score === "number" && (
        <p
          className={cn(
            "mt-1.5 font-mono text-[15px] tabular-nums",
            won ? "text-accent" : "text-ink-2",
          )}
        >
          {side.score.toFixed(1)}
        </p>
      )}
    </button>
  );
}

export default function HigherLower() {
  const { user, loading: authLoading } = useCurrentUser();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [scope, setScope] = useState<string[]>([]);
  const [pairs, setPairs] = useState<DuelPair[]>([]);
  const [seenMedia, setSeenMedia] = useState<number[]>([]);
  const [dIndex, setDIndex] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [results, setResults] = useState<DuelResult[]>([]);
  const [wallet, setWallet] = useState<MiniGameWallet | null>(null);
  const [loadError, setLoadError] = useState(false);
  const submittedRef = useRef(false);

  const pair = pairs[dIndex] ?? null;
  const total = results.reduce((sum, r) => sum + r.points, 0);
  const winner: "a" | "b" | null =
    pair && typeof pair.a.score === "number" && typeof pair.b.score === "number"
      ? pair.a.score > pair.b.score
        ? "a"
        : "b"
      : null;

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

  const startGame = useCallback(async (nextScope: string[], exclude: number[]) => {
    setPhase("loading");
    setLoadError(false);
    const dealt = await fetchDuels(nextScope, DUELS_PER_GAME, exclude);
    if (dealt === null || dealt.pairs.length === 0) {
      setLoadError(true);
      setPhase("lobby");
      return;
    }
    setPairs(dealt.pairs);
    setSeenMedia((prev) => [
      ...prev,
      ...dealt.pairs.flatMap((p) =>
        [p.a.id, p.b.id].filter((id): id is number => typeof id === "number" && id > 0),
      ),
    ]);
    setDIndex(0);
    setPicked(null);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    submittedRef.current = false;
    setPhase("playing");
  }, []);

  const pick = (side: "a" | "b") => {
    if (!pair || picked !== null || !winner) return;
    const correct = side === winner;
    const nextStreak = correct ? streak + 1 : 0;
    const points = correct ? streakPoints(nextStreak) : 0;
    setPicked(side);
    setStreak(nextStreak);
    setBestStreak((best) => Math.max(best, nextStreak));
    const pickedSide = side === "a" ? pair.a : pair.b;
    setResults((prev) => [
      ...prev,
      {
        mediaId: typeof pickedSide.id === "number" ? pickedSide.id : 0,
        correct,
        points,
        streakAfter: nextStreak,
        aTitle: pair.a.title,
        bTitle: pair.b.title,
        aScore: pair.a.score ?? 0,
        bScore: pair.b.score ?? 0,
      },
    ]);
    setPhase("revealed");
  };

  const next = () => {
    if (dIndex + 1 >= pairs.length) {
      setPhase("summary");
      return;
    }
    setDIndex((i) => i + 1);
    setPicked(null);
    setPhase("playing");
  };

  // Submit once when the summary lands: credits the wallet and stores the
  // leaderboard row in a single server-validated call.
  useEffect(() => {
    if (phase !== "summary" || submittedRef.current) return;
    submittedRef.current = true;
    void submitGame({
      game: "higher-lower",
      scope: scope.length > 0 ? scope : ["movie", "series", "game", "anime", "manga"],
      rounds: results.map((r) => ({
        mediaId: r.mediaId,
        attemptsUsed: 1,
        hintsUsed: [],
        points: r.points,
      })),
    }).then((nextWallet) => {
      if (nextWallet) {
        setWallet({ balance: nextWallet.balance, totalEarned: nextWallet.totalEarned });
      }
    });
  }, [phase, results, scope]);

  if (phase === "lobby" || phase === "loading") {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Higher or lower</SectionLabel>
        <span className="mt-4 block text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          Pick your pool
        </span>
        <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
          Which scores higher?
        </h3>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-2">
          Eight score duels. Wins pay 10 → 20 → 40 → 80 → 100 on a streak — one
          miss resets it. Solves earn wallet points as usual.
        </p>

        <div className="mt-4">
          <ScopePicker scope={scope} onChange={setScope} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void startGame(scope, seenMedia)}
            disabled={phase === "loading"}
            className={cn(
              "rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background transition-opacity",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {phase === "loading" ? "Dealing duels…" : "Start game"}
          </button>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
            <Coins className="size-3.5 text-accent" />
            {wallet ? `${wallet.balance} pts` : "…"}
          </span>
        </div>

        {loadError && (
          <p className="mt-4 text-[13px] text-ink-2">
            Couldn&rsquo;t deal the duels. Check your connection and try again.
          </p>
        )}
      </article>
    );
  }

  if (phase === "summary") {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Higher or lower — results</SectionLabel>
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
            <Flame className="size-3.5 text-accent" />
            Best streak {bestStreak}
          </span>
        </div>

        <ul className="mt-4 flex flex-col">
          {results.map((result, index) => (
            <li
              key={`${result.aTitle}-${result.bTitle}-${index}`}
              className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
            >
              {result.correct ? (
                <Check className="size-4 shrink-0 text-accent" strokeWidth={2.5} />
              ) : (
                <X className="size-4 shrink-0 text-red-400" strokeWidth={2.5} />
              )}
              <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                <span className="font-semibold text-foreground">{result.aTitle}</span>{" "}
                <span className="font-mono tabular-nums">{result.aScore.toFixed(1)}</span>
                {" vs "}
                <span className="font-semibold text-foreground">{result.bTitle}</span>{" "}
                <span className="font-mono tabular-nums">{result.bScore.toFixed(1)}</span>
              </p>
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
            onClick={() => void startGame(scope, seenMedia)}
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
      </article>
    );
  }

  if (!pair) return null;

  const answered = phase === "revealed";
  const lastResult = answered ? results[results.length - 1] : null;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>
        Duel {dIndex + 1} of {pairs.length}
      </SectionLabel>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
          <Flame className={cn("size-3.5", streak > 1 ? "text-accent" : "text-ink-3")} />
          {streak > 0 ? `Streak ${streak} · next worth ${streakPoints(streak + 1)}` : "No streak"}
        </span>
        <span className="font-mono text-[12px] tabular-nums text-accent">
          {answered && lastResult ? `+${lastResult.points}` : `${total} pts`}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
        {(["a", "b"] as const).map((side) => {
          const card = side === "a" ? pair.a : pair.b;
          const isWinner = winner === side;
          const isPicked = picked === side;
          return (
            <DuelCard
              key={side}
              side={card}
              revealed={answered}
              dimmed={answered && !isWinner && !isPicked}
              won={answered && isWinner}
              lost={answered && isPicked && !isWinner}
              disabled={answered}
              onPick={() => pick(side)}
            />
          );
        })}
      </div>

      {answered && (
        <button
          type="button"
          onClick={next}
          autoFocus
          className={cn(
            "mt-4 rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          {dIndex + 1 >= pairs.length ? "See results" : "Next duel"}
        </button>
      )}
    </article>
  );
}
