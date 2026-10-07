import { Skeleton } from "@/app/components/ui/skeleton";
import { CardSkeleton } from "@/app/features/home/continue-list";
import { FriendsSkeleton } from "@/app/features/home/friends-card";
import SectionLabel from "@/app/features/home/section-label";
import { WeekSkeleton } from "@/app/features/home/week-card";

export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Greeting Header Skeleton */}
      <section>
        <Skeleton className="h-3 w-36 rounded-sm" />

        <div className="mt-5 flex items-baseline gap-3">
          <Skeleton className="h-10 w-64 max-w-[70vw] sm:h-12" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-4 w-44" />
          <span className="text-ink-3">—</span>
          <Skeleton className="h-4 w-60" />
        </div>
      </section>

      {/* Continue Section Skeleton */}
      <section className="mt-10">
        <SectionLabel>Continue</SectionLabel>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>

      <div role="separator" aria-hidden="true" className="my-9 h-px w-full bg-line" />

      {/* Bottom Grid: Week + Friends Skeleton */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>This Week</SectionLabel>
          <WeekSkeleton />
        </div>

        <div className="flex flex-col rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Friends</SectionLabel>
          <FriendsSkeleton />
        </div>
      </section>
    </div>
  );
}

