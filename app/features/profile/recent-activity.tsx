"use client";

import { useCallback, useEffect, useState } from "react";

import SectionLabel from "@/app/features/home/section-label";
import { authFetch } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

type ActivityDay = {
  date: string;
  added: number;
  completed: number;
};

type ActivityData = {
  days: ActivityDay[];
};

const DAYS = 30;
const MAX_ROWS = 14;

// "yyyy-MM-dd" parsed as local components, so the label never shifts a day
// across time zones the way new Date("...") (UTC midnight) would.
function parseDayKey(key: string): Date | null {
  if (!key) return null;
  const parts = key.split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const fallback = new Date(key);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function dayKeyOf(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateLabel(key: string, todayKey: string, yesterdayKey: string): string {
  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";
  const date = parseDayKey(key);
  if (!date) return key;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type ActivityApiResponse = {
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

async function fetchRecentActivity(): Promise<ActivityData> {
  const response = await authFetch(
    `/api/profile/activity?days=${DAYS}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("load failed");

  const data = (await response.json()) as ActivityApiResponse;

  // The backend returns daily summaries aggregated per date (yyyy-MM-dd)
  if (Array.isArray(data.dailySummaries)) {
    return {
      days: data.dailySummaries.map((item) => ({
        date: item.date,
        added: item.added ?? 0,
        completed: item.completed ?? 0,
      })),
    };
  }

  // Fallback to aggregating items if dailySummaries is absent
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const map = new Map<string, { added: number; completed: number }>();

  for (const item of rawItems) {
    let key = item.date ?? "";
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      if (!Number.isNaN(d.getTime())) {
        key = dayKeyOf(d);
      }
    }
    if (!key) continue;

    const current = map.get(key) ?? { added: 0, completed: 0 };
    current.added += item.added ?? 0;
    current.completed += item.completed ?? 0;
    map.set(key, current);
  }

  const days: ActivityDay[] = Array.from(map.entries()).map(([date, counts]) => ({
    date,
    added: counts.added,
    completed: counts.completed,
  }));

  return { days };
}

// Single-flight, mirroring the continue-list pattern: concurrent mounts reuse
// the in-flight promise; it is cleared on settle so later visits refetch.
let inFlightActivity: Promise<ActivityData> | null = null;

function fetchRecentActivityOnce(): Promise<ActivityData> {
  if (!inFlightActivity) {
    inFlightActivity = fetchRecentActivity().finally(() => {
      inFlightActivity = null;
    });
  }
  return inFlightActivity;
}

function ActivityRow({
  label,
  added,
  completed,
}: {
  label: string;
  added: number;
  completed: number;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="min-w-0 truncate text-[12.5px] text-ink-2">{label}</span>
      <span className="flex shrink-0 items-center gap-3">
        {added > 0 && (
          <span className="text-[11px] font-mono tracking-[0.04em] text-accent">
            +{added}
          </span>
        )}
        {completed > 0 && (
          <span className="text-[11px] font-mono tracking-[0.04em] text-foreground">
            {completed} done
          </span>
        )}
      </span>
    </li>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-hidden="true" className="mt-5">
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
          <div className="h-3 w-20 animate-pulse rounded-full bg-surface-3" />
          <div className="h-3 w-16 animate-pulse rounded-full bg-surface-3" />
        </div>
      ))}
    </div>
  );
}

export default function RecentActivity({ className }: { className?: string }) {
  const { user, loading } = useCurrentUser();
  const [data, setData] = useState<ActivityData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await fetchRecentActivityOnce());
      setError(false);
    } catch {
      setData(null);
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    (async () => {
      try {
        const next = await fetchRecentActivityOnce();
        if (cancelled) return;
        setData(next);
        setError(false);
      } catch {
        if (cancelled) return;
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const todayKey = dayKeyOf(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKeyOf(yesterday);

  const days = data?.days ?? [];
  const totalAdded = days.reduce((sum, day) => sum + day.added, 0);
  const totalCompleted = days.reduce((sum, day) => sum + day.completed, 0);
  const visible = days.slice(0, MAX_ROWS);
  const hidden = days.length - visible.length;

  if (error) {
    return (
      <article className={cn("rounded-xl border border-line bg-surface-2 p-5 sm:p-6", className)}>
        <SectionLabel>Recent activity</SectionLabel>
        <div className="mt-8 flex flex-col items-center gap-3 px-2 py-8 text-center">
          <p className="text-[13px] text-ink-2">Couldn&rsquo;t load recent activity.</p>
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
    <article className={cn("rounded-xl border border-line bg-surface-2 p-5 sm:p-6", className)}>
      <SectionLabel>
        {data !== null && (totalAdded + totalCompleted) > 0
          ? `Recent activity — last ${DAYS} days`
          : "Recent activity"}
      </SectionLabel>

      {data === null ? (
        <ActivitySkeleton />
      ) : days.length === 0 ? (
        <div className="mt-8 flex flex-col items-center px-2 py-8 text-center">
          <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
            No activity yet
          </span>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
            Add a title to your library or finish one and the last {DAYS} days
            will start filling in here.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-2">
            {visible.map((day, index) => (
              <ActivityRow
                key={`${day.date}-${index}`}
                label={dateLabel(day.date, todayKey, yesterdayKey)}
                added={day.added}
                completed={day.completed}
              />
            ))}
          </ul>

          {hidden > 0 && (
            <p className="pt-2.5 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
              +{hidden} more days
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div>
              <p className="font-serif text-[24px] leading-none tracking-[-0.01em] text-foreground">
                {totalAdded}
              </p>
              <p className="mt-1.5 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                Added
              </p>
            </div>
            <div>
              <p className="font-serif text-[24px] leading-none tracking-[-0.01em] text-foreground">
                {totalCompleted}
              </p>
              <p className="mt-1.5 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                Completed
              </p>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
