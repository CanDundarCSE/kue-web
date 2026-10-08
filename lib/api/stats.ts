import { authFetch } from "@/lib/api/client";

export type StatsOverview = {
  totalItems: number;
  totalCompleted: number;
  totalInProgress: number;
  totalFavorites: number;
  movie?: { total: number };
  series?: { total: number };
  game?: { total: number };
  anime?: { total: number };
  manga?: { total: number };
};

export type StatsTimeSpent = {
  totalHours: number;
  movieHours?: number;
  seriesHours?: number;
  gameHours?: number;
  animeHours?: number;
  mangaHours?: number;
};

export type MediumHours = {
  medium: "game" | "series" | "film" | "anime" | "manga" | string;
  label: string;
  hours: number;
};

export type HoursByMediumResponse =
  | MediumHours[]
  | {
      game?: number;
      series?: number;
      film?: number;
      movie?: number;
      anime?: number;
      manga?: number;
    }
  | {
      items?: Array<{
        medium?: string;
        type?: string;
        hours?: number;
        totalHours?: number;
        name?: string;
      }>;
    }
  | Record<string, number>;

export type StatsGenreItem = {
  name: string;
  count: number;
};

export type StatsGenresResponse =
  | StatsGenreItem[]
  | { genres?: Array<{ name?: string; genre?: string; count?: number }> }
  | { items?: Array<{ name?: string; genre?: string; count?: number }> }
  | Record<string, number>;

export type StatsStreak = {
  currentStreak: number;
  longestStreak: number;
};

export type StatsStreakResponse = {
  currentStreak?: number;
  longestStreak?: number;
  streak?: number;
  current?: number;
  longest?: number;
};

export type StatsReview = {
  year?: number;
  topMedium?: string;
  longestStreak?: string | number;
  heaviestMonth?: string;
  lateNightFinale?: string;
  oneFinaleBinged?: string;
};

export type StatsActivityItem = {
  date: string;
  added?: number;
  completed?: number;
};

export type StatsActivityResponse = {
  dailySummaries?: Array<{
    date: string;
    added: number;
    completed: number;
    total?: number;
  }>;
  items?: Array<{
    date?: string;
    createdAt?: string;
    added?: number;
    completed?: number;
  }>;
};

const STATS_TTL_MS = 60_000;

function createCachedFetcher<T>(path: string, ttlMs = STATS_TTL_MS) {
  let inFlight: Promise<T> | null = null;
  let cache: { at: number; data: T } | null = null;

  const fetcher = (force = false): Promise<T> => {
    if (!force && cache && Date.now() - cache.at < ttlMs) {
      return Promise.resolve(cache.data);
    }

    if (!inFlight) {
      inFlight = authFetch(path, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error(`load failed: ${path}`);
          const data = (await response.json()) as T;
          cache = { at: Date.now(), data };
          return data;
        })
        .finally(() => {
          inFlight = null;
        });
    }

    return inFlight;
  };

  fetcher.clear = () => {
    cache = null;
    inFlight = null;
  };

  return fetcher;
}

export const fetchOverview = createCachedFetcher<StatsOverview>("/api/stats/overview");
export const fetchTimeSpent = createCachedFetcher<StatsTimeSpent>("/api/stats/time-spent");
export const fetchHoursByMedium = createCachedFetcher<HoursByMediumResponse>("/api/stats/hours-by-medium");
export const fetchGenres = createCachedFetcher<StatsGenresResponse>("/api/stats/genres");
export const fetchStreak = createCachedFetcher<StatsStreakResponse>("/api/stats/streak");
export const fetchReview = createCachedFetcher<StatsReview>("/api/stats/review");

// Activity fetcher supports dynamic day windows (default: 182 days = 26 weeks)
const activityCache = new Map<number, { at: number; data: StatsActivityResponse }>();
const activityInFlight = new Map<number, Promise<StatsActivityResponse>>();

export function fetchActivity(days = 182, force = false): Promise<StatsActivityResponse> {
  const cached = activityCache.get(days);
  if (!force && cached && Date.now() - cached.at < STATS_TTL_MS) {
    return Promise.resolve(cached.data);
  }

  const existingInFlight = activityInFlight.get(days);
  if (existingInFlight) {
    return existingInFlight;
  }

  const promise = authFetch(`/api/stats/activity?days=${days}`, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("load failed: /api/stats/activity");
      const data = (await response.json()) as StatsActivityResponse;
      activityCache.set(days, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      activityInFlight.delete(days);
    });

  activityInFlight.set(days, promise);
  return promise;
}

export function clearStatsCache() {
  fetchOverview.clear();
  fetchTimeSpent.clear();
  fetchHoursByMedium.clear();
  fetchGenres.clear();
  fetchStreak.clear();
  fetchReview.clear();
  activityCache.clear();
  activityInFlight.clear();
}
