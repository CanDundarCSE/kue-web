import { Skeleton } from "@/app/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Search */}
      <div className="mt-8">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3 rounded-xl border border-line bg-surface-2/40 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-[54px] w-[42px] shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-2.5 w-1/4" />
              </div>
              <Skeleton className="size-8 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-surface-2/40 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-b-0">
                <Skeleton className="h-3 w-5" />
                <Skeleton className="h-[54px] w-[42px] shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
                <Skeleton className="size-8 rounded-lg" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <Skeleton className="h-3 w-24 mb-4" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-36 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

