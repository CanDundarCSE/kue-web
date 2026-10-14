"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Coins, EyeOff, RotateCcw, X } from "lucide-react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import SectionLabel from "@/app/features/home/section-label";
import ScopePicker from "@/app/features/mini-games/scope-picker";
import {
  fetchQuiz,
  fetchWallet,
  spendHint,
  submitGame,
  type MiniGameWallet,
  type QuizQuestion,
} from "@/lib/api/mini-games";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const QUESTIONS_PER_GAME = 10;
const POINTS_PER_CORRECT = 20;
const FIFTY_FIFTY_PRICE = 15;

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

function asMediaType(value: string): MediaType {
  return MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

type QuizResult = {
  questionId: string;
  mediaId: number;
  correct: boolean;
  lifelineUsed: boolean;
  points: number;
};

type Phase = "lobby" | "loading" | "playing" | "revealed" | "summary";

export default function MediaQuiz() {
  const { user, loading: authLoading } = useCurrentUser();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [scope, setScope] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [seenQ, setSeenQ] = useState<string[]>([]);
  const [lastMedia, setLastMedia] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [lifelineBusy, setLifelineBusy] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [wallet, setWallet] = useState<MiniGameWallet | null>(null);
  const [loadError, setLoadError] = useState(false);
  const submittedRef = useRef(false);

  const question = questions[qIndex] ?? null;

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

  const startQuiz = useCallback(
    async (nextScope: string[], exclude: string[], excludeSubjects: number[]) => {
      setPhase("loading");
      setLoadError(false);
      const dealt = await fetchQuiz(nextScope, QUESTIONS_PER_GAME, exclude, excludeSubjects);
      if (dealt === null || dealt.questions.length === 0) {
        setLoadError(true);
        setPhase("lobby");
        return;
      }
      setQuestions(dealt.questions);
      setSeenQ((prev) => [...prev, ...dealt.questions.map((q) => q.id)]);
      setLastMedia(
        dealt.questions
          .map((q) => q.mediaId)
          .filter((id): id is number => typeof id === "number" && id > 0),
      );
      setQIndex(0);
      setPicked(null);
      setEliminated([]);
      setResults([]);
      submittedRef.current = false;
      setPhase("playing");
    },
    [],
  );

  const answer = (index: number) => {
    if (!question || picked !== null) return;
    const correct = index === question.answerIndex;
    setPicked(index);
    setResults((prev) => [
      ...prev,
      {
        questionId: question.id,
        mediaId: question.mediaId ?? 0,
        correct,
        lifelineUsed: eliminated.length > 0,
        points: correct ? POINTS_PER_CORRECT : 0,
      },
    ]);
    setPhase("revealed");
  };

  const lifeline = async () => {
    if (!question || picked !== null || eliminated.length > 0 || lifelineBusy) return;
    setLifelineBusy(true);
    const result = await spendHint("fiftyFifty");
    setLifelineBusy(false);
    if (!result.ok) return;
    if (result.balance !== null) {
      setWallet((prev) => (prev ? { ...prev, balance: result.balance as number } : prev));
    }
    const wrong = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.answerIndex);
    const shuffled = [...wrong].sort(() => Math.random() - 0.5);
    setEliminated(shuffled.slice(0, Math.min(2, wrong.length)));
  };

  const next = () => {
    if (qIndex + 1 >= questions.length) {
      setPhase("summary");
      return;
    }
    setQIndex((i) => i + 1);
    setPicked(null);
    setEliminated([]);
    setPhase("playing");
  };

  // Submit once when the summary lands: credits the wallet and stores the
  // leaderboard row in a single server-validated call.
  useEffect(() => {
    if (phase !== "summary" || submittedRef.current) return;
    submittedRef.current = true;
    void submitGame({
      game: "media-quiz",
      scope: scope.length > 0 ? scope : ["movie", "series", "game", "anime", "manga"],
      rounds: results.map((r) => ({
        mediaId: r.mediaId,
        attemptsUsed: 1,
        hintsUsed: r.lifelineUsed ? ["fiftyFifty"] : [],
        points: r.points,
      })),
    }).then((nextWallet) => {
      if (nextWallet) {
        setWallet({ balance: nextWallet.balance, totalEarned: nextWallet.totalEarned });
      }
    });
  }, [phase, results, scope]);

  const total = results.reduce((sum, r) => sum + r.points, 0);

  if (phase === "lobby" || phase === "loading") {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Media quiz</SectionLabel>
        <span className="mt-4 block text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          Pick your pool
        </span>
        <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
          How broad is your knowledge?
        </h3>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-2">
          Ten questions, 20 pts each — catalog trivia and general
          knowledge mixed. Stuck? A 50/50 lifeline costs 15 pts.
        </p>

        <div className="mt-4">
          <ScopePicker scope={scope} onChange={setScope} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void startQuiz(scope, seenQ, lastMedia)}
            disabled={phase === "loading"}
            className={cn(
              "rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background transition-opacity",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {phase === "loading" ? "Writing questions…" : "Start quiz"}
          </button>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
            <Coins className="size-3.5 text-accent" />
            {wallet ? `${wallet.balance} pts` : "…"}
          </span>
        </div>

        {loadError && (
          <p className="mt-4 text-[13px] text-ink-2">
            Couldn&rsquo;t put the quiz together. Check your connection and try again.
          </p>
        )}
      </article>
    );
  }

  if (phase === "summary") {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Media quiz — results</SectionLabel>
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
          {results.map((result, index) => {
            const q = questions[index];
            return (
              <li
                key={result.questionId}
                className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
              >
                {result.correct ? (
                  <Check className="size-4 shrink-0 text-accent" strokeWidth={2.5} />
                ) : (
                  <X className="size-4 shrink-0 text-red-400" strokeWidth={2.5} />
                )}
                <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                  {q?.prompt ?? `Question ${index + 1}`}
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
            );
          })}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void startQuiz(scope, seenQ, lastMedia)}
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

  if (!question) return null;

  const answered = phase === "revealed";
  const correct = picked !== null && picked === question.answerIndex;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>
        Question {qIndex + 1} of {questions.length}
      </SectionLabel>

      <div className="mt-4 flex items-center justify-end gap-4">
        <span className="font-mono text-[12px] tabular-nums text-accent">
          {answered ? (correct ? `+${POINTS_PER_CORRECT}` : "+0") : `${POINTS_PER_CORRECT} pts`}
        </span>
      </div>

      {question.posters.length === 1 ? (
        <div className="mt-3 flex items-center gap-4">
          <MediaAvatarCard
            title={question.posters[0].title}
            year={question.posters[0].year ?? undefined}
            image={question.posters[0].image ?? undefined}
            type={asMediaType(question.posters[0].mediaType)}
            size="lg"
            className="shrink-0"
          />
          <h3 className="min-w-0 flex-1 font-serif text-[22px] leading-snug text-foreground">
            {question.prompt}
          </h3>
        </div>
      ) : (
        <>
          {question.posters.length > 1 && (
            <div className="mt-3 flex gap-2">
              {question.posters.slice(0, 4).map((poster, index) => (
                <MediaAvatarCard
                  key={`${poster.title}-${index}`}
                  title={poster.title}
                  year={poster.year ?? undefined}
                  image={poster.image ?? undefined}
                  type={asMediaType(poster.mediaType)}
                  size="md"
                />
              ))}
            </div>
          )}
          <h3 className="mt-3 font-serif text-[22px] leading-snug text-foreground">
            {question.prompt}
          </h3>
        </>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {question.options.map((option, originalIndex) => {
          const isAnswer = originalIndex === question.answerIndex;
          const isPicked = originalIndex === picked;
          const isGone = eliminated.includes(originalIndex);
          return (
            <li key={originalIndex}>
              <button
                type="button"
                onClick={() => answer(originalIndex)}
                disabled={answered || isGone}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[14px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  answered && isAnswer
                    ? "border-accent/60 bg-accent/10 font-semibold text-foreground"
                    : answered && isPicked
                      ? "border-red-400/50 text-red-400"
                      : isGone
                        ? "border-line/60 text-ink-3 opacity-60"
                        : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                  (answered || isGone) && "disabled:pointer-events-none",
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
                  {String.fromCharCode(65 + originalIndex)}
                </span>
                <span className={cn("min-w-0 flex-1", isGone && "line-through")}>
                  {option}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!answered ? (
          <>
            <button
              type="button"
              onClick={() => void lifeline()}
              disabled={
                eliminated.length > 0 ||
                lifelineBusy ||
                (wallet?.balance ?? 0) < FIFTY_FIFTY_PRICE
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-line-2/70 px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
                "transition-colors hover:bg-surface-3 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              <EyeOff className="size-3.5" />
              {lifelineBusy ? "…" : `50/50 −${FIFTY_FIFTY_PRICE}`}
            </button>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
              <Coins className="size-3.5 text-accent" />
              {wallet ? `${wallet.balance} pts` : "…"}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={next}
            autoFocus
            className={cn(
              "rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            {qIndex + 1 >= questions.length ? "See results" : "Next question"}
          </button>
        )}
      </div>
    </article>
  );
}
