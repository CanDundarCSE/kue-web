"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Coins, Flame, RotateCcw, Timer, X } from "lucide-react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import SectionLabel from "@/app/features/home/section-label";
import ScopePicker from "@/app/features/mini-games/scope-picker";
import {
  fetchSprint,
  fetchWallet,
  submitGame,
  type MiniGameWallet,
  type SprintRound,
} from "@/lib/api/mini-games";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const ROUNDS_PER_GAME = 10;
const TIME_LIMIT_MS = 10_000;
const TICK_MS = 100;
const LOW_TIME_MS = 3_000;

// Correct answers pay a streak bonus, capped for the score submission
// endpoint (rounds over 100 are rejected).
function sprintPoints(streak: number): number {
  return Math.min(15 + 5 * streak, 100);
}

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

function asMediaType(value: string): MediaType {
  return MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

type SprintResult = {
  mediaId: number;
  correct: boolean;
  timedOut: boolean;
  points: number;
  streakAfter: number;
  title: string;
};

type Phase = "lobby" | "loading" | "playing" | "revealed" | "summary";

export default function GenreSprint() {
  const { user, loading: authLoading } = useCurrentUser();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [scope, setScope] = useState<string[]>([]);
  const [rounds, setRounds] = useState<SprintRound[]>([]);
  const [seenMedia, setSeenMedia] = useState<number[]>([]);
  const [rIndex, setRIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(TIME_LIMIT_MS);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [results, setResults] = useState<SprintResult[]>([]);
  const [wallet, setWallet] = useState<MiniGameWallet | null>(null);
  const [loadError, setLoadError] = useState(false);
  const submittedRef = useRef(false);
  const deadlineRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const round = rounds[rIndex] ?? null;
  const total = results.reduce((sum, r) => sum + r.points, 0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resolve = useCallback(
    (index: number | null) => {
      if (!round) return;
      stopTimer();
      const correct = index !== null && index === round.answerIndex;
      const nextStreak = correct ? streak + 1 : 0;
      setPicked(index);
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setResults((prev) => [
        ...prev,
        {
          mediaId: round.media.id ?? 0,
          correct,
          timedOut: index === null,
          points: correct ? sprintPoints(nextStreak) : 0,
          streakAfter: nextStreak,
          title: round.media.title,
        },
      ]);
      setPhase("revealed");
    },
    [round, streak, stopTimer],
  );

  // Latest resolver for the interval callback (avoids stale closures).
  const resolveRef = useRef(resolve);
  useEffect(() => {
    resolveRef.current = resolve;
  });

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

  // Countdown per round; expiry auto-marks the round wrong. The bar
  // resets in the event handlers that open each round (start/next), never
  // synchronously here (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (phase !== "playing") return;
    deadlineRef.current = Date.now() + TIME_LIMIT_MS;
    timerRef.current = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        resolveRef.current(null);
      } else {
        setRemaining(left);
      }
    }, TICK_MS);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, rIndex]);

  useEffect(() => stopTimer, [stopTimer]);

  const startGame = useCallback(
    async (nextScope: string[], exclude: number[]) => {
      stopTimer();
      setPhase("loading");
      setLoadError(false);
      const dealt = await fetchSprint(nextScope, ROUNDS_PER_GAME, exclude);
      if (dealt === null || dealt.rounds.length === 0) {
        setLoadError(true);
        setPhase("lobby");
        return;
      }
      setRounds(dealt.rounds);
      setSeenMedia((prev) => [
        ...prev,
        ...dealt.rounds.flatMap((r) =>
          typeof r.media.id === "number" && r.media.id > 0 ? [r.media.id] : [],
        ),
      ]);
      setRIndex(0);
      setPicked(null);
      setRemaining(TIME_LIMIT_MS);
      setStreak(0);
      setBestStreak(0);
      setResults([]);
      submittedRef.current = false;
      setPhase("playing");
    },
    [stopTimer],
  );

  const next = () => {
    if (rIndex + 1 >= rounds.length) {
      setPhase("summary");
      return;
    }
    setRIndex((i) => i + 1);
    setPicked(null);
    setRemaining(TIME_LIMIT_MS);
    setPhase("playing");
  };

  // Submit once when the summary lands: credits the wallet and stores the
  // leaderboard row in a single server-validated call.
  useEffect(() => {
    if (phase !== "summary" || submittedRef.current) return;
    submittedRef.current = true;
    void submitGame({
      game: "genre-sprint",
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
        <SectionLabel>Genre sprint</SectionLabel>
        <span className="mt-4 block text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          Pick your pool
        </span>
        <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
          Name the genre at speed.
        </h3>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-2">
          Ten posters, ten seconds each. Streaks grow the payout — hesitate
          past zero and the round is gone. Solves earn wallet points as usual.
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
            {phase === "loading" ? "Lining up…" : "Start sprint"}
          </button>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
            <Coins className="size-3.5 text-accent" />
            {wallet ? `${wallet.balance} pts` : "…"}
          </span>
        </div>

        {loadError && (
          <p className="mt-4 text-[13px] text-ink-2">
            Couldn&rsquo;t line up the posters. Check your connection and try again.
          </p>
        )}
      </article>
    );
  }

  if (phase === "summary") {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Genre sprint — results</SectionLabel>
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
              key={`${result.title}-${index}`}
              className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
            >
              {result.correct ? (
                <Check className="size-4 shrink-0 text-accent" strokeWidth={2.5} />
              ) : (
                <X className="size-4 shrink-0 text-red-400" strokeWidth={2.5} />
              )}
              <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                <span className="font-semibold text-foreground">{result.title}</span>
                {result.timedOut && <span> · timed out</span>}
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
            Sprint again
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

  if (!round) return null;

  const answered = phase === "revealed";
  const lastResult = answered ? results[results.length - 1] : null;
  const lowTime = !answered && remaining <= LOW_TIME_MS;
  const progress = Math.max(0, Math.min(100, (remaining / TIME_LIMIT_MS) * 100));

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>
        Round {rIndex + 1} of {rounds.length}
      </SectionLabel>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
          <Flame className={cn("size-3.5", streak > 1 ? "text-accent" : "text-ink-3")} />
          {streak > 0 ? `Streak ${streak}` : "No streak"}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-[12px] tabular-nums",
            lowTime ? "text-red-400" : "text-ink-2",
          )}
        >
          <Timer className="size-3.5" />
          {(remaining / 1000).toFixed(1)}s
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Time left"
        className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn("h-full rounded-full", lowTime ? "bg-red-400" : "bg-foreground")}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <MediaAvatarCard
          title={round.media.title}
          year={round.media.year ?? undefined}
          image={round.media.coverImage ?? undefined}
          type={asMediaType(round.media.mediaType)}
          size="xl"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-[22px] leading-snug text-foreground">
            {answered ? round.media.title : "Mystery title"}
          </h3>
          <p className="mt-1 text-[13px] text-ink-2">
            {answered
              ? `${round.media.year ?? "—"} — pick the genre.`
              : "Which genre fits this poster best?"}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[12px] tabular-nums text-accent">
          {answered && lastResult ? `+${lastResult.points}` : `${total} pts`}
        </span>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {round.options.map((option, index) => {
          const isAnswer = index === round.answerIndex;
          const isPicked = index === picked;
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => resolve(index)}
                disabled={answered}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[14px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  answered && isAnswer
                    ? "border-accent/60 bg-accent/10 font-semibold text-foreground"
                    : answered && isPicked
                      ? "border-red-400/50 text-red-400"
                      : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                  answered && "disabled:pointer-events-none",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md font-mono text-[11px]",
                    answered && isAnswer
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-3 text-ink-3",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="min-w-0 flex-1 truncate">{option}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {answered && lastResult && (
        <p role="status" className="mt-3 text-[13px] leading-relaxed text-ink-2">
          {lastResult.timedOut
            ? "Time ran out — streak reset."
            : lastResult.correct
              ? `Correct — streak ${lastResult.streakAfter}.`
              : "Not quite — streak reset."}
        </p>
      )}

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
          {rIndex + 1 >= rounds.length ? "See results" : "Next poster"}
        </button>
      )}
    </article>
  );
}
