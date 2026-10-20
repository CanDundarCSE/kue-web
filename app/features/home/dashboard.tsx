"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";
import ContinueList from "@/app/features/home/continue-list";
import FriendsCard from "@/app/features/home/friends-card";
import SectionLabel from "@/app/features/home/section-label";
import SpotlightCard from "@/app/features/home/spotlight-card";
import { fetchOverview } from "@/lib/api/stats";
import { formatDateLabel, getPeriod, getTagline } from "@/lib/home-time";
import { useCurrentUser } from "@/lib/use-current-user";

function NameSkeleton() {
  return (
    <Skeleton as="span" className="inline-block h-[0.85em] w-28 max-w-[45vw] align-[-0.08em]" />
  );
}

function CountSkeleton() {
  return (
    <Skeleton as="span" className="inline-block h-3.5 w-16 align-[-0.15em]" />
  );
}

export default function Dashboard({ now }: { now: number }) {
  const { user, loading } = useCurrentUser();
  const [inProgress, setInProgress] = useState<number | null>(null);
  const date = new Date(now);
  const period = getPeriod(date.getHours());

  const name = user?.username;

  // Real in-progress count for the greeting line; the streak had no backend
  // backing, so the subtitle now states what the data actually says.
  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    fetchOverview()
      .then((data) => {
        if (cancelled) return;
        setInProgress(data.totalInProgress);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <section aria-labelledby="greeting-heading">
        <SectionLabel>{formatDateLabel(now)}</SectionLabel>

        <h1
          id="greeting-heading"
          className="mt-5 font-serif text-[clamp(30px,4.5vw,46px)] leading-[1.05] tracking-[-0.01em] text-foreground"
        >
          {period}, {name ? name : loading ? <NameSkeleton /> : "there"}
          <span className="text-accent">.</span>
        </h1>

        <p className="mt-3 text-[14px] text-ink-2">
          {inProgress === null ? (
            <CountSkeleton />
          ) : inProgress > 0 ? (
            <>{inProgress} in progress</>
          ) : (
            <>Nothing in progress yet</>
          )}
          {" — "}
          {getTagline(period)}.
        </p>
      </section>

      <section className="mt-10" aria-label="Continue">
        <SectionLabel>Continue</SectionLabel>
        <ContinueList className="mt-5" />
      </section>

      <div role="separator" aria-hidden="true" className="my-9 h-px w-full bg-line" />

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <SpotlightCard />
        <FriendsCard />
      </section>
    </div>
  );
}
