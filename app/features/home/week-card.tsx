"use client";

import { useCallback, useEffect, useState } from "react";

import SectionLabel from "@/app/features/home/section-label";
import { authFetch } from "@/lib/api/client";
import { fetchOverview } from "@/lib/api/stats";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

type WeekDay = {
  label: string;
  date: string;
  value: number;
};

type WeekData = {
  totalItems: number;
  totalCompleted: number;
  totalHours: number;
  days: WeekDay[];
};

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function loadWeekData(now: number): Promise<WeekData> {
  const [overview, timeResponse, activityResponse] = await Promise.all([
    // Shared with the dashboard greeting via the single-flight cache, so a
    // page load fires the overview exactly once.
    fetchOverview(),
    authFetch("/api/stats/time-spent", { cache: "no-store" }),
    authFetch("/api/stats/activity", { cache: "no-store" }),
  ]);

  if (!timeResponse.ok || !activityResponse.ok) {
    throw new Error("load failed");
  }

  const timeSpent = (await timeResponse.json()) as { totalHours?: number };
  const activity = (await activityResponse.json()) as {
    items?: { date: string; added: number; completed: number }[];
  };

  // Monday of the current week, so the bars always read M T W T F S S.
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const days: WeekDay[] = DAY_LETTERS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { label, date: dateKey(date), value: 0 };
  });

  for (const item of activity.items ?? []) {
    const day = days.find((candidate) => candidate.date === item.date);
    if (day) day.value += item.added + item.completed;
  }

  return {
    totalItems: overview.totalItems,
    totalCompleted: overview.totalCompleted,
    totalHours: timeSpent.totalHours ?? 0,
    days,
  };
}

function WeekEmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center px-2 py-8 text-center">
      <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        No activity yet
      </span>
      <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
        Nothing logged this week.
      </h3>
      <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
        Add a title to your library and this week will start filling in.
      </p>
    </div>
  );
}

function WeekSkeleton() {
  return (
    <>
      <div aria-hidden="true" className="mt-8 flex items-end gap-2.5 sm:gap-3">
        {DAY_LETTERS.map((letter, index) => (
          <div key={`${letter}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="h-4 w-full max-w-[30px] animate-pulse rounded-full bg-surface-3" />
            <span className="h-1.5 w-2 animate-pulse rounded-full bg-surface-3" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <div className="h-7 w-10 animate-pulse rounded-md bg-surface-3" />
            <div className="mt-3 h-1.5 w-14 animate-pulse rounded-full bg-surface-3" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function WeekCard({ now }: { now: number }) {
  const { user, loading } = useCurrentUser();
  const [data, setData] = useState<WeekData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await loadWeekData(now));
      setError(false);
    } catch {
      setData(null);
      setError(true);
    }
  }, [now]);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    (async () => {
      try {
        const next = await loadWeekData(now);
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
  }, [user, loading, now]);

  if (error) {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <SectionLabel>This week</SectionLabel>
        <div className="mt-8 flex flex-col items-center gap-3 px-2 py-8 text-center">
          <p className="text-[13px] text-ink-2">Couldn&rsquo;t load this week.</p>
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

  const weekUpdates = data?.days.reduce((sum, day) => sum + day.value, 0) ?? 0;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>
        {data ? `This week — ${weekUpdates} logged` : "This week"}
      </SectionLabel>

      {data === null ? (
        <WeekSkeleton />
      ) : data.totalItems === 0 ? (
        <WeekEmptyState />
      ) : (
        <>
          <div className="mt-8 flex items-end gap-2.5 sm:gap-3">
            {(() => {
              const max = Math.max(1, ...data.days.map((day) => day.value));
              const todayIndex = (new Date(now).getDay() + 6) % 7;

              return data.days.map((day, index) => {
                const isToday = index === todayIndex;
                const height =
                  day.value === 0 ? 0 : Math.max(3, Math.round((day.value / max) * 16));

                return (
                  <div key={`${day.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-4 w-full items-end justify-center">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "w-full max-w-[30px] rounded-full",
                          isToday ? "bg-accent" : "bg-line-2/70",
                        )}
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[9px] leading-none font-mono tracking-[0.08em] uppercase",
                        isToday ? "text-foreground" : "text-ink-3",
                      )}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              });
            })()}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
            {(
              [
                { value: data.totalItems, label: "In library" },
                { value: data.totalCompleted, label: "Finished" },
                { value: Math.round(data.totalHours * 10) / 10, label: "Hours total" },
              ] as const
            ).map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-[30px] leading-none tracking-[-0.01em] text-foreground">
                  {stat.value}
                </p>
                <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
