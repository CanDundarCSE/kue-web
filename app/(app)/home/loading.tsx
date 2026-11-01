import { Skeleton } from "@/app/components/ui/skeleton";
import { CardSkeleton } from "@/app/features/home/continue-list";
import { FriendsSkeleton } from "@/app/features/home/friends-card";
import SectionLabel from "@/app/features/home/section-label";
import { SpotlightSkeleton } from "@/app/features/home/spotlight-card";

export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 py-6 sm:px-8 sm:py-10">
      {/* Greeting Header Skeleton */}
      <section>
        <Skeleton className="h-3 w-36 rounded-sm" />

        <div className="mt-4 flex items-baseline gap-3 sm:mt-5">
          <Skeleton className="h-10 w-64 max-w-[70vw] sm:h-12" />
        </div>

        <div className="mt-2 flex items-center gap-2 sm:mt-3">
          <Skeleton className="h-4 w-44" />
          <span className="text-ink-3">—</span>
          <Skeleton className="h-4 w-60" />
        </div>
      </section>

      {/* Continue Section Skeleton */}
      <section className="mt-7 sm:mt-10">
        <SectionLabel>Continue</SectionLabel>
        <div className="mt-4 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-hidden px-4 pt-1 pb-3 sm:mx-0 sm:mt-5 sm:px-1">
          <CardSkeleton className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-8px)] sm:max-w-none xl:w-[calc(25%-12px)]" />
          <CardSkeleton className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-8px)] sm:max-w-none xl:w-[calc(25%-12px)]" />
          <CardSkeleton className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-8px)] sm:max-w-none xl:w-[calc(25%-12px)]" />
          <CardSkeleton className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-8px)] sm:max-w-none xl:w-[calc(25%-12px)]" />
        </div>
      </section>

      <div role="separator" aria-hidden="true" className="my-6 h-px w-full bg-line sm:my-9" />

      {/* Bottom Grid: Spotlight + Friends Skeleton */}
      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <SpotlightSkeleton />

        <div className="flex flex-col rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
          <SectionLabel>Friends</SectionLabel>
          <FriendsSkeleton />
        </div>
      </section>
    </div>
  );
}
