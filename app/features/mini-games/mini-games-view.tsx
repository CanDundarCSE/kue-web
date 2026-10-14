"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import UserAvatar from "@/app/components/user-avatar";
import SectionLabel from "@/app/features/home/section-label";
import GenreSprint from "@/app/features/mini-games/genre-sprint";
import HigherLower from "@/app/features/mini-games/higher-lower";
import MediaQuiz from "@/app/features/mini-games/media-quiz";
import PosterGame from "@/app/features/mini-games/poster-game";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/api/mini-games";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const BOARD_GAMES = [
  { id: "poster-guess", label: "Poster guess" },
  { id: "media-quiz", label: "Quiz" },
  { id: "higher-lower", label: "Higher-Lower" },
  { id: "genre-sprint", label: "Sprint" },
] as const;

function LeaderboardPanel({ username }: { username: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [mine, setMine] = useState<LeaderboardEntry | null>(null);
  const [error, setError] = useState(false);
  const [boardGame, setBoardGame] = useState<string>("poster-guess");

  const load = useCallback(async () => {
    try {
      const data = await fetchLeaderboard(boardGame, 20);
      if (data === null) {
        setEntries(null);
        setError(true);
        return;
      }
      setEntries(data.entries);
      setMine(data.mine);
      setError(false);
    } catch {
      setEntries(null);
      setError(true);
    }
  }, [boardGame]);

  // Deferred: setState must not run synchronously in the effect body
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      if (cancelled) return;
      void load().catch(() => undefined);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [load]);

  if (error) {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>Leaderboard</SectionLabel>
        <div className="mt-4 flex flex-col items-center gap-3 px-2 py-8 text-center">
          <p className="text-[13px] text-ink-2">Couldn&rsquo;t load the leaderboard.</p>
          <button
            type="button"
            onClick={() => void load()}
            className={cn(
              "rounded-md border border-line-2/70 px-3 py-1.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            Try again
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>Leaderboard</SectionLabel>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
        Ranked by total points — ties break by best game, then fewest games.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {BOARD_GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => {
              setEntries(null);
              setMine(null);
              setError(false);
              setBoardGame(game.id);
            }}
            aria-pressed={boardGame === game.id}
            className={cn(
              "rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              boardGame === game.id
                ? "bg-foreground font-semibold text-background"
                : "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
            )}
          >
            {game.label}
          </button>
        ))}
      </div>

      {entries === null ? (
        <ul aria-hidden="true" className="mt-4 flex flex-col">
          {[0, 1, 2, 3, 4].map((index) => (
            <li
              key={index}
              className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
            >
              <div className="h-3 w-5 shrink-0 animate-pulse rounded-full bg-surface-3" />
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-surface-3" />
              <div className="h-3.5 min-w-0 flex-1 animate-pulse rounded-full bg-surface-3" />
              <div className="h-3.5 w-12 shrink-0 animate-pulse rounded-full bg-surface-3" />
            </li>
          ))}
        </ul>
      ) : entries.length === 0 ? (
        <div className="mt-4 flex flex-col items-center px-2 py-8 text-center">
          <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
            No scores yet
          </span>
          <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
            Be the first on the board.
          </h3>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
            Finish a game and your best score will show up here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col">
          {entries.map((entry, index) => {
            const isMine = entry.username === username;
            return (
              <li
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0",
                  isMine && "rounded-lg border border-accent/40 bg-accent/5 px-2",
                )}
              >
                <span className="w-5 shrink-0 font-mono text-[12px] tabular-nums text-ink-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <UserAvatar
                  username={entry.username}
                  avatarId={entry.avatarId}
                  className="size-8 rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {entry.username}
                    {isMine && <span className="text-accent"> · you</span>}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
                    Best {entry.bestScore} · {entry.gamesPlayed}{" "}
                    {entry.gamesPlayed === 1 ? "game" : "games"}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[13px] tabular-nums text-foreground">
                  {entry.totalScore}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {mine && (entries?.length ?? 0) > 0 && !(entries ?? []).some((e) => e.username === username) && (
        <p className="mt-4 border-t border-line pt-4 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase">
          Your total — {mine.totalScore} pts · best {mine.bestScore}
        </p>
      )}
    </article>
  );
}

export default function MiniGamesView() {
  const { user, loading } = useCurrentUser();
  const [tab, setTab] = useState<"play" | "board">("play");
  const [game, setGame] = useState<"poster" | "quiz" | "duel" | "sprint" | null>(null);

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <section aria-labelledby="mini-games-heading">
        <SectionLabel>Mini-games</SectionLabel>
        <h1
          id="mini-games-heading"
          className="mt-5 font-serif text-[clamp(30px,4.5vw,46px)] leading-[1.05] tracking-[-0.01em] text-foreground"
        >
          Guess the poster<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-2">
          Guess pixelated posters, test your trivia, or call higher-or-lower —
          solves earn points, hints spend them.
        </p>
      </section>

      {loading ? (
        <div aria-hidden="true" className="mt-8 rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-surface-3" />
          <div className="mt-4 h-7 w-2/5 animate-pulse rounded-md bg-surface-3" />
          <div className="mt-3 h-4 w-3/5 animate-pulse rounded-full bg-surface-3" />
        </div>
      ) : user !== null ? (
        <>
          <div
            role="tablist"
            aria-label="Mini-games sections"
            className="mt-8 flex gap-6 overflow-x-auto border-b border-line [scrollbar-width:none] sm:gap-8"
          >
            {(
              [
                { id: "play", label: "Play" },
                { id: "board", label: "Leaderboard" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 pt-1 pb-3 text-[11px] font-mono tracking-[0.14em] whitespace-nowrap uppercase transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  tab === item.id
                    ? "border-b-2 border-accent font-semibold text-foreground"
                    : "border-b-2 border-transparent text-ink-3 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === "play" ? (
              game === null ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {(
                    [
                      {
                        id: "poster",
                        title: "Poster guess",
                        body: "Pixelated posters that clear with every miss. Name them before they do.",
                      },
                      {
                        id: "quiz",
                        title: "Media quiz",
                        body: "Catalog trivia and general knowledge mixed together.",
                      },
                      {
                        id: "duel",
                        title: "Higher or lower",
                        body: "Two posters, one call — which scores higher? Streaks multiply the payout.",
                      },
                      {
                        id: "sprint",
                        title: "Genre sprint",
                        body: "Name the genre from the artwork before the clock runs out. Hesitate and it's gone.",
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGame(item.id)}
                      className={cn(
                        "rounded-xl border border-line bg-surface-2 p-5 text-left transition-colors sm:p-6",
                        "hover:border-line-2",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                      )}
                    >
                      <span className="block font-serif text-xl leading-tight text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-2 block max-w-xs text-[13px] leading-relaxed text-ink-2">
                        {item.body}
                      </span>
                      <span className="mt-4 inline-block font-mono text-[11px] tracking-[0.08em] text-accent uppercase">
                        Play →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setGame(null)}
                    className={cn(
                      "mb-4 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase transition-colors",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    )}
                  >
                    ← All games
                  </button>
                  {game === "poster" ? (
                    <PosterGame />
                  ) : game === "quiz" ? (
                    <MediaQuiz />
                  ) : game === "duel" ? (
                    <HigherLower />
                  ) : (
                    <GenreSprint />
                  )}
                </div>
              )
            ) : (
              <LeaderboardPanel username={user.username} />
            )}
          </div>
        </>
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-line bg-surface-2 px-5 py-16 text-center sm:px-8">
          <span className="text-[10px] font-mono tracking-[0.2em] text-ink-3 uppercase">
            Mini-games
          </span>
          <h2 className="mt-4 font-serif text-[28px] leading-tight text-foreground">
            Sign in to play<span className="text-accent">.</span>
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
            Scores, hint points, and the leaderboard live here once you are
            signed in.
          </p>
          <Link
            href="/login"
            className="mt-6 rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
