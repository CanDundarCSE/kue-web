"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchOverview, type StatsOverview } from "@/lib/api/stats";
import { initialOf } from "@/lib/current-user";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

function StatValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-serif text-[26px] leading-none tracking-[-0.01em] text-foreground">
        {value}
      </p>
      <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
        {label}
      </p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-2">
      <div className="h-6 w-10 animate-pulse rounded-md bg-surface-3" />
      <div className="h-2 w-14 animate-pulse rounded-full bg-surface-3" />
    </div>
  );
}

export default function ProfileHeader() {
  const { user, loading } = useCurrentUser();
  const [overview, setOverview] = useState<StatsOverview | null>(null);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    fetchOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || user === null) {
    return (
      <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex w-full max-w-md items-center justify-center gap-3 sm:max-w-none">
            <div
              aria-hidden="true"
              className="size-14 shrink-0 animate-pulse rounded-full bg-surface-3 sm:size-16"
            />
            <div className="h-7 w-44 max-w-[50vw] animate-pulse rounded-md bg-surface-3" />
          </div>
          <div
            aria-hidden="true"
            className="grid w-full max-w-sm grid-cols-2 gap-x-6 gap-y-5 sm:max-w-none sm:grid-cols-4"
          >
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        </div>
      </article>
    );
  }

  const stats = overview
    ? ([
        { label: "Library", value: overview.totalItems },
        { label: "Completed", value: overview.totalCompleted },
        { label: "In progress", value: overview.totalInProgress },
        { label: "Favorites", value: overview.totalFavorites },
      ] as const)
    : null;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-3 sm:max-w-none">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-soft text-[22px] font-semibold text-accent sm:size-16 sm:text-[26px]"
          >
            {initialOf(user.username)}
          </span>

          <h1 className="min-w-0 truncate font-serif text-[clamp(24px,3.5vw,36px)] leading-[1.05] tracking-[-0.01em] text-foreground">
            {user.username}
          </h1>

          {user.isPrivate && (
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full border border-line bg-background px-2.5 py-1",
                "text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase",
              )}
            >
              <Lock className="size-3" strokeWidth={2} />
              Private
            </span>
          )}
        </div>

        {user.bio && (
          <p className="max-w-xl text-center text-[14px] leading-relaxed text-ink-2">
            {user.bio}
          </p>
        )}

        <div
          className="grid w-full max-w-sm grid-cols-2 gap-x-6 gap-y-5 sm:max-w-none sm:grid-cols-4"
          aria-label="Profile statistics"
        >
          {stats === null
            ? ([0, 1, 2, 3] as const).map((index) => <StatSkeleton key={index} />)
            : stats.map((stat) => (
                <StatValue key={stat.label} label={stat.label} value={stat.value} />
              ))}
        </div>
      </div>
    </article>
  );
}
