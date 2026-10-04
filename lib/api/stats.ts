import { authFetch } from "@/lib/api/client";

export type StatsOverview = {
  totalItems: number;
  totalCompleted: number;
  totalInProgress: number;
};

// The dashboard greeting and the week card both need the overview, and on a
// page load they would otherwise fire the same request twice. The in-flight
// promise dedupes concurrent callers, and the short TTL keeps a quick
// remount from refetching data that was still fresh seconds ago.
const OVERVIEW_TTL_MS = 60_000;

let overviewInFlight: Promise<StatsOverview> | null = null;
let overviewCache: { at: number; data: StatsOverview } | null = null;

export function fetchOverview(): Promise<StatsOverview> {
  if (overviewCache && Date.now() - overviewCache.at < OVERVIEW_TTL_MS) {
    return Promise.resolve(overviewCache.data);
  }

  if (!overviewInFlight) {
    overviewInFlight = authFetch("/api/stats/overview", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        const data = (await response.json()) as StatsOverview;
        overviewCache = { at: Date.now(), data };
        return data;
      })
      .finally(() => {
        overviewInFlight = null;
      });
  }

  return overviewInFlight;
}
