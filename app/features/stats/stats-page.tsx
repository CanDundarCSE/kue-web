"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import SectionLabel from "@/app/features/home/section-label";
import { Skeleton } from "@/app/components/ui/skeleton";
import ActivityHeatmap, { type ActivityHeatmapItem } from "@/app/components/activity-heatmap";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  clearStatsCache,
  fetchActivity,
  fetchGenres,
  fetchHoursByMedium,
  fetchOverview,
  fetchReview,
  fetchStreak,
  fetchTimeSpent,
  type HoursByMediumResponse,
  type StatsGenreItem,
  type StatsGenresResponse,
  type StatsOverview,
  type StatsReview,
  type StatsStreakResponse,
  type StatsTimeSpent,
} from "@/lib/api/stats";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

type MediumKey = "game" | "series" | "film" | "anime" | "manga";

type MediumRow = {
  key: MediumKey;
  label: string;
  hours: number;
};

const ORDERED_MEDIUMS: { key: MediumKey; label: string }[] = [
  { key: "game", label: "GAME" },
  { key: "series", label: "SERIES" },
  { key: "film", label: "FILM" },
  { key: "anime", label: "ANIME" },
  { key: "manga", label: "MANGA" },
];

export type StatsPageData = {
  overview: StatsOverview;
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  hoursByMedium: MediumRow[];
  genres: StatsGenreItem[];
  activity: ActivityHeatmapItem[];
  review: {
    year: number;
    topMedium: string | null;
    longestStreakText: string | null;
    heaviestMonth: string | null;
    bingedFinale: string | null;
  };
};

function formatHoursValue(val: number): string {
  if (val === 0) return "0.0 h";
  if (val % 1 === 0) return `${val} h`;
  return `${val.toFixed(1)} h`;
}

function parseHoursByMedium(data: HoursByMediumResponse | null): Record<MediumKey, number> {
  const result: Record<MediumKey, number> = {
    game: 0,
    series: 0,
    film: 0,
    anime: 0,
    manga: 0,
  };

  if (!data) return result;

  if (Array.isArray(data)) {
    for (const item of data) {
      const med = (item.medium || "").toLowerCase();
      if (med === "game") result.game = item.hours || 0;
      else if (med === "series") result.series = item.hours || 0;
      else if (med === "film" || med === "movie") result.film = item.hours || 0;
      else if (med === "anime") result.anime = item.hours || 0;
      else if (med === "manga") result.manga = item.hours || 0;
    }
    return result;
  }

  if (typeof data === "object") {
    const raw = data as Record<string, unknown>;
    if (Array.isArray(raw.items)) {
      for (const item of raw.items) {
        const med = (item.medium || item.type || item.name || "").toLowerCase();
        const hrs = Number(item.hours ?? item.totalHours ?? 0);
        if (med === "game") result.game = hrs;
        else if (med === "series") result.series = hrs;
        else if (med === "film" || med === "movie") result.film = hrs;
        else if (med === "anime") result.anime = hrs;
        else if (med === "manga") result.manga = hrs;
      }
      return result;
    }

    result.game = Number(raw.game ?? 0);
    result.series = Number(raw.series ?? 0);
    result.film = Number(raw.film ?? raw.movie ?? 0);
    result.anime = Number(raw.anime ?? 0);
    result.manga = Number(raw.manga ?? 0);
  }

  return result;
}

function parseGenres(data: StatsGenresResponse | null): StatsGenreItem[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data
      .map((item) => ({
        name: item.name || (item as { genre?: string }).genre || "",
        count: Number(item.count ?? 0),
      }))
      .filter((g) => g.name.length > 0)
      .sort((a, b) => b.count - a.count);
  }

  if (typeof data === "object") {
    const raw = data as Record<string, unknown>;
    const list = Array.isArray(raw.genres)
      ? raw.genres
      : Array.isArray(raw.items)
      ? raw.items
      : null;

    if (list) {
      return list
        .map((item) => ({
          name: item.name || item.genre || "",
          count: Number(item.count ?? 0),
        }))
        .filter((g) => g.name.length > 0)
        .sort((a, b) => b.count - a.count);
    }

    return Object.entries(raw)
      .filter(([k]) => typeof raw[k] === "number")
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }

  return [];
}

function capitalizeMedium(medium: string): string {
  if (!medium) return "";
  const lower = medium.toLowerCase();
  if (lower === "game") return "Game";
  if (lower === "series") return "Series";
  if (lower === "film" || lower === "movie") return "Film";
  if (lower === "anime") return "Anime";
  if (lower === "manga") return "Manga";
  return medium.charAt(0).toUpperCase() + medium.slice(1);
}

// Calculates activity summary (streaks & busiest month) as fallback
function calculateActivityStats(activity: ActivityHeatmapItem[], now: number) {
  const activeSet = new Set<string>();
  const monthSums = new Map<string, number>();

  for (const item of activity) {
    if (!item.date) continue;
    const total = (item.added ?? 0) + (item.completed ?? 0);
    if (total > 0) {
      activeSet.add(item.date);
    }
    const month = item.date.slice(0, 7);
    monthSums.set(month, (monthSums.get(month) ?? 0) + total);
  }

  // Calculate current and longest streak from the last 182 days
  let currentStreak = 0;
  let countingCurrent = true;
  let streak = 0;
  let longestStreak = 0;

  for (let back = 0; back <= 182; back++) {
    const iso = new Date(now - back * 86_400_000).toISOString().slice(0, 10);
    const hasActivity = activeSet.has(iso);

    if (hasActivity) {
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
      if (countingCurrent) {
        currentStreak += 1;
      }
    } else {
      if (back === 0) {
        // Today might not have activity yet; check yesterday before ending current streak
        continue;
      }
      countingCurrent = false;
      streak = 0;
    }
  }

  let busiestMonthName: string | null = null;
  if (monthSums.size > 0) {
    const sorted = [...monthSums.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted[0] && sorted[0][1] > 0) {
      const monthIso = sorted[0][0];
      const d = new Date(`${monthIso}-01T00:00:00Z`);
      if (!Number.isNaN(d.getTime())) {
        busiestMonthName = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    busiestMonth: busiestMonthName,
  };
}

async function loadStatsData(now: number): Promise<StatsPageData> {
  const [
    overviewResult,
    timeSpentResult,
    hoursResult,
    genresResult,
    streakResult,
    reviewResult,
    activityResult,
  ] = await Promise.allSettled([
    fetchOverview(),
    fetchTimeSpent(),
    fetchHoursByMedium(),
    fetchGenres(),
    fetchStreak(),
    fetchReview(),
    fetchActivity(182),
  ]);

  const overview: StatsOverview =
    overviewResult.status === "fulfilled"
      ? overviewResult.value
      : { totalItems: 0, totalCompleted: 0, totalInProgress: 0, totalFavorites: 0 };

  const timeSpent: StatsTimeSpent | null =
    timeSpentResult.status === "fulfilled" ? timeSpentResult.value : null;

  const hoursRaw = hoursResult.status === "fulfilled" ? hoursResult.value : null;
  const parsedMediumHours = parseHoursByMedium(hoursRaw);

  const hoursByMedium: MediumRow[] = ORDERED_MEDIUMS.map((m) => ({
    key: m.key,
    label: m.label,
    hours: parsedMediumHours[m.key] || 0,
  }));

  const totalCalculatedHours = hoursByMedium.reduce((sum, row) => sum + row.hours, 0);
  const totalHours = timeSpent?.totalHours ?? totalCalculatedHours;

  const genresRaw = genresResult.status === "fulfilled" ? genresResult.value : null;
  const genres = parseGenres(genresRaw);

  const activityRaw = activityResult.status === "fulfilled" ? activityResult.value : null;
  const activityItems: ActivityHeatmapItem[] = [];

  if (activityRaw?.dailySummaries && Array.isArray(activityRaw.dailySummaries)) {
    for (const item of activityRaw.dailySummaries) {
      activityItems.push({
        date: item.date,
        added: item.added ?? 0,
        completed: item.completed ?? 0,
      });
    }
  } else if (activityRaw?.items && Array.isArray(activityRaw.items)) {
    for (const item of activityRaw.items) {
      if (item.date) {
        activityItems.push({
          date: item.date,
          added: item.added ?? 0,
          completed: item.completed ?? 0,
        });
      }
    }
  }

  const streakRaw: StatsStreakResponse | null =
    streakResult.status === "fulfilled" ? streakResult.value : null;

  const derivedActivityStats = calculateActivityStats(activityItems, now);

  const currentStreak =
    streakRaw?.currentStreak ??
    streakRaw?.streak ??
    streakRaw?.current ??
    derivedActivityStats.currentStreak;

  const longestStreak =
    streakRaw?.longestStreak ??
    streakRaw?.longest ??
    derivedActivityStats.longestStreak;

  const reviewRaw: StatsReview | null =
    reviewResult.status === "fulfilled" ? reviewResult.value : null;

  // Derive top medium from hours by medium if not directly in review data
  const topMediumCandidate = [...hoursByMedium].sort((a, b) => b.hours - a.hours)[0];
  const derivedTopMedium =
    topMediumCandidate && topMediumCandidate.hours > 0
      ? capitalizeMedium(topMediumCandidate.key)
      : null;

  const topMedium = reviewRaw?.topMedium ? capitalizeMedium(reviewRaw.topMedium) : derivedTopMedium;

  const longestStreakText =
    reviewRaw?.longestStreak !== undefined && reviewRaw.longestStreak !== null
      ? typeof reviewRaw.longestStreak === "number"
        ? `${reviewRaw.longestStreak} days`
        : String(reviewRaw.longestStreak)
      : longestStreak > 0
      ? `${longestStreak} days`
      : null;

  const heaviestMonth = reviewRaw?.heaviestMonth || derivedActivityStats.busiestMonth;
  const bingedFinale = reviewRaw?.lateNightFinale || reviewRaw?.oneFinaleBinged || null;

  const year = reviewRaw?.year || new Date().getFullYear();

  return {
    overview,
    totalHours,
    currentStreak,
    longestStreak,
    hoursByMedium,
    genres,
    activity: activityItems,
    review: {
      year,
      topMedium,
      longestStreakText,
      heaviestMonth,
      bingedFinale,
    },
  };
}

export function StatsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="mt-4 h-10 w-72 sm:w-96 rounded-lg" />
      </div>

      {/* 4 Summary Cards skeleton */}
      <div className="mt-8 grid grid-cols-1 divide-y divide-line rounded-xl border border-line bg-surface-2 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="p-5 sm:p-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-4 h-12 w-20" />
          </div>
        ))}
      </div>

      {/* Main Grid skeleton */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        {/* Hours by Medium skeleton */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Hours by medium</SectionLabel>
          <div className="mt-6 space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-1 flex-1 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </article>

        {/* Genre Pull skeleton */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Genre pull</SectionLabel>
          <div className="mt-6 space-y-3.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-1 flex-1 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </article>

        {/* Heatmap skeleton */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Last 26 weeks — one cell per day</SectionLabel>
          <div className="mt-6 h-28 w-full animate-pulse rounded-lg bg-surface-3/50" />
        </article>

        {/* 2025 in Review skeleton */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>In review</SectionLabel>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 py-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

export default function StatsPage({ now = 0 }: { now?: number }) {
  const [timestamp] = useState(() => (now > 0 ? now : Date.now()));
  const { user, loading: authLoading } = useCurrentUser();
  const [data, setData] = useState<StatsPageData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    clearStatsCache();
    try {
      const stats = await loadStatsData(timestamp);
      setData(stats);
      setError(false);
    } catch {
      setData(null);
      setError(true);
    }
  }, [timestamp]);

  useEffect(() => {
    if (authLoading || user === null) return;

    let cancelled = false;

    (async () => {
      try {
        const stats = await loadStatsData(timestamp);
        if (cancelled) return;
        setData(stats);
        setError(false);
      } catch {
        if (cancelled) return;
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, timestamp]);

  // Auth loading state
  if (authLoading || (user !== null && data === null && !error)) {
    return <StatsSkeleton />;
  }

  // Not signed in state
  if (user === null) {
    return (
      <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center px-5 py-24 text-center sm:px-8">
        <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          Stats
        </span>
        <h1 className="mt-4 font-serif text-[28px] sm:text-[32px] leading-tight text-foreground">
          Sign in to see your stats<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
          Your hours logged, format breakdowns, genre preferences, streaks, and activity heatmaps live here.
        </p>
        <Link
          href="/login"
          className={cn(
            "mt-6 rounded-lg border border-line bg-surface-2 px-5 py-2 text-[13px] font-medium text-foreground",
            "transition-colors duration-150 hover:bg-surface-3 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          Sign in
        </Link>
      </div>
    );
  }

  // Error state
  if (error || data === null) {
    return (
      <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-8 text-center">
          <SectionLabel>Stats</SectionLabel>
          <div className="mt-8 flex flex-col items-center gap-3 px-2 py-8">
            <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
              Error
            </span>
            <h3 className="font-serif text-xl text-foreground">
              Couldn&rsquo;t load your stats.
            </h3>
            <p className="max-w-xs text-[13px] text-ink-2">
              There was an issue reaching the server. Please try again.
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className={cn(
                "mt-2 rounded-md border border-line-2/70 px-3.5 py-1.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase",
                "transition-colors duration-150 motion-reduce:transition-none",
                "hover:bg-surface-3 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              )}
            >
              Try again
            </button>
          </div>
        </article>
      </div>
    );
  }

  // Calculated fields for summary cards
  const totalItems = data.overview.totalItems;
  const totalCompleted = data.overview.totalCompleted;
  const completionRate =
    totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const totalHoursInt = Math.round(data.totalHours);

  // Hours by medium data
  const maxMediumHours = Math.max(1, ...data.hoursByMedium.map((m) => m.hours));
  const hasHoursData = data.hoursByMedium.some((m) => m.hours > 0);
  const highestMediumKey = data.hoursByMedium.reduce(
    (leader, row) => (row.hours > leader.hours ? row : leader),
    data.hoursByMedium[0],
  ).key;

  // Genre pull data
  const topGenres = data.genres.slice(0, 6);
  const maxGenreCount = Math.max(1, ...topGenres.map((g) => g.count));
  const hasGenreData = topGenres.length > 0;

  // Heatmap data
  const hasActivityData = data.activity.some(
    (item) => (item.added ?? 0) > 0 || (item.completed ?? 0) > 0,
  );

  // Review data
  const hasReviewData = Boolean(
    data.review.topMedium ||
      data.review.longestStreakText ||
      data.review.heaviestMonth ||
      data.review.bingedFinale,
  );

  const todayTimestamp = timestamp;

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Header section matching reference */}
      <header aria-label="Page Header">
        <SectionLabel>Stats</SectionLabel>
        <h1 className="mt-4 font-serif text-[clamp(32px,4.5vw,46px)] leading-[1.08] tracking-[-0.01em] text-foreground">
          Your habits, in numbers<span className="text-accent">.</span>
        </h1>
      </header>

      {/* 4 Summary Cards matching reference */}
      <TooltipProvider delayDuration={150}>
        <section
          aria-label="Summary Cards"
          className="mt-8 grid grid-cols-1 divide-y divide-line rounded-xl border border-line bg-surface-2 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4"
        >
          {/* TOTAL CONSUMED — ALL FORMATS */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-5 sm:p-6 flex flex-col justify-between cursor-default">
                <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  Total consumed — all formats
                </span>
                <p className="mt-4 flex items-baseline font-serif text-[42px] sm:text-[46px] leading-none tracking-[-0.01em] text-foreground">
                  <span>{totalHoursInt}</span>
                  <span className="ml-1 text-[22px] sm:text-[24px] font-serif text-ink-3 font-normal">
                    h
                  </span>
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Total hours spent across all media formats
            </TooltipContent>
          </Tooltip>

          {/* IN LIBRARY */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-5 sm:p-6 flex flex-col justify-between cursor-default">
                <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  In library
                </span>
                <p className="mt-4 font-serif text-[42px] sm:text-[46px] leading-none tracking-[-0.01em] text-foreground">
                  {totalItems}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Total titles saved to your library
            </TooltipContent>
          </Tooltip>

          {/* COMPLETED */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-5 sm:p-6 flex flex-col justify-between cursor-default">
                <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  Completed
                </span>
                <p className="mt-4 flex items-baseline font-serif text-[42px] sm:text-[46px] leading-none tracking-[-0.01em] text-foreground">
                  <span>{completionRate}</span>
                  <span className="ml-0.5 text-[20px] sm:text-[22px] font-serif text-ink-3 font-normal">
                    %
                  </span>
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {totalCompleted} completed out of {totalItems} total titles
            </TooltipContent>
          </Tooltip>

          {/* STREAK */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-5 sm:p-6 flex flex-col justify-between cursor-default">
                <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  Streak
                </span>
                <p className="mt-4 flex items-baseline font-serif text-[42px] sm:text-[46px] leading-none tracking-[-0.01em] text-foreground">
                  <span>{data.currentStreak}</span>
                  <span className="ml-1 text-[22px] sm:text-[24px] font-serif text-ink-3 font-normal">
                    d
                  </span>
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Current streak of consecutive active days
            </TooltipContent>
          </Tooltip>
        </section>
      </TooltipProvider>

      {/* Main Grid: Left (Hours by medium + Heatmap) & Right (Genre pull + Review) */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        {/* HOURS BY MEDIUM */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Hours by medium</SectionLabel>

          {!hasHoursData ? (
            <div className="my-6 flex flex-col items-center px-2 py-8 text-center">
              <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                No hours logged
              </span>
              <h3 className="mt-2 font-serif text-xl leading-tight text-foreground">
                Nothing logged yet.
              </h3>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
                Log progress in films, series, games, anime, or manga to see your hours breakdown.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {data.hoursByMedium.map((row) => {
                const isLeader = row.key === highestMediumKey && row.hours > 0;
                const percent =
                  maxMediumHours > 0 ? (row.hours / maxMediumHours) * 100 : 0;

                return (
                  <div
                    key={row.key}
                    className="flex items-center gap-3 sm:gap-4 py-1"
                  >
                    <span className="w-14 sm:w-16 shrink-0 text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                      {row.label}
                    </span>
                    <div className="relative flex-1 h-[2px] bg-line rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isLeader
                            ? "bg-accent"
                            : "bg-foreground/80 dark:bg-zinc-200",
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-[11px] font-mono tabular-nums text-ink-2">
                      {formatHoursValue(row.hours)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* GENRE PULL */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Genre pull</SectionLabel>

          {!hasGenreData ? (
            <div className="my-6 flex flex-col items-center px-2 py-8 text-center">
              <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                No genres yet
              </span>
              <h3 className="mt-2 font-serif text-xl leading-tight text-foreground">
                No genres recorded.
              </h3>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
                Add titles with genre tags to your library to reveal your genre taste profile.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3.5">
              {topGenres.map((genre) => {
                const percent =
                  maxGenreCount > 0 ? (genre.count / maxGenreCount) * 100 : 0;

                return (
                  <div
                    key={genre.name}
                    className="flex items-center gap-3 sm:gap-4 py-0.5"
                  >
                    <span className="w-24 sm:w-28 shrink-0 text-[13px] text-foreground font-normal truncate">
                      {genre.name}
                    </span>
                    <div className="relative flex-1 h-[2px] bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground/75 dark:bg-zinc-200 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-right text-[11px] font-mono tabular-nums text-ink-3">
                      &times;{genre.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* LAST 26 WEEKS HEATMAP */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Last 26 weeks — one cell per day</SectionLabel>

          {!hasActivityData ? (
            <div className="my-6 flex flex-col items-center px-2 py-8 text-center">
              <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                No activity
              </span>
              <h3 className="mt-2 font-serif text-xl leading-tight text-foreground">
                No activity in the last 26 weeks.
              </h3>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
                Log updates or complete titles to start building your activity graph.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <ActivityHeatmap
                items={data.activity}
                today={todayTimestamp}
                weeks={26}
                hideHeader
              />
            </div>
          )}
        </article>

        {/* YEAR IN REVIEW */}
        <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>{data.review.year} in review</SectionLabel>

          {!hasReviewData ? (
            <div className="my-6 flex flex-col items-center px-2 py-8 text-center">
              <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                No review data
              </span>
              <h3 className="mt-2 font-serif text-xl leading-tight text-foreground">
                Not enough data for this year.
              </h3>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
                Keep tracking throughout the year to unlock your personal year-in-review summary.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 divide-x divide-line">
              {/* Left Column: Top Medium & Heaviest Month */}
              <div className="divide-y divide-line pr-4 sm:pr-6">
                {/* Top Medium */}
                <div className="pb-5 sm:pb-6">
                  <p className="font-serif text-[22px] sm:text-[24px] leading-tight text-foreground">
                    {data.review.topMedium || "—"}
                  </p>
                  <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                    Top medium
                  </p>
                </div>

                {/* Heaviest Month */}
                <div className="pt-5 sm:pt-6">
                  <p className="font-serif text-[22px] sm:text-[24px] leading-tight text-foreground">
                    {data.review.heaviestMonth || "—"}
                  </p>
                  <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                    Heaviest month
                  </p>
                </div>
              </div>

              {/* Right Column: Longest Streak & Binged Finale */}
              <div className="divide-y divide-line pl-4 sm:pl-6">
                {/* Longest Streak */}
                <div className="pb-5 sm:pb-6">
                  <p className="font-serif text-[22px] sm:text-[24px] leading-tight text-foreground">
                    {data.review.longestStreakText || "—"}
                  </p>
                  <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                    Longest streak
                  </p>
                </div>

                {/* Binged Finale */}
                <div className="pt-5 sm:pt-6">
                  <p className="font-serif text-[22px] sm:text-[24px] leading-tight text-foreground">
                    {data.review.bingedFinale || "3 AM"}
                  </p>
                  <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                    One finale, binged
                  </p>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
