"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { authFetch } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

type EntryMedia = {
  id: number;
  title: string;
  mediaType: string;
  coverImage?: string | null;
  year?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
};

type ContinueEntry = {
  mediaId: number;
  mediaType: string;
  status: string;
  progress?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  media: EntryMedia;
};

type ContinueItem = {
  mediaId: number;
  title: string;
  year?: number;
  type: MediaType;
  statusLabel: string;
  image?: string;
  hasProgress: boolean;
  current: number;
  total?: number;
  unit: string;
};

function asMediaType(value: string): MediaType {
  return MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

function statusLabel(status: string, type: MediaType): string {
  switch (status) {
    case "playing":
      return "Playing";
    case "reading":
      return "Reading";
    case "in_progress":
      if (type === "manga") return "Reading";
      if (type === "game") return "Playing";
      return "Watching";
    default:
      return "In progress";
  }
}

function shortUnit(unitName: string | null | undefined, type: MediaType): string {
  if (unitName) {
    const lower = unitName.toLowerCase();
    if (lower.includes("chapter")) return "ch";
    if (lower.includes("episode")) return "ep";
  }
  return type === "manga" ? "ch" : "ep";
}

function mapEntry(entry: ContinueEntry): ContinueItem | null {
  // The backend only returns in_progress/playing/reading entries, but a progress
  // step can flip an entry to "completed" — that belongs in no one's continue
  // list anymore.
  if (entry.status === "completed") return null;

  const type = asMediaType(entry.media?.mediaType ?? entry.mediaType ?? "movie");
  const total = entry.media?.totalUnits ?? entry.totalUnits ?? null;
  const episodic = type === "anime" || type === "series" || type === "manga";

  return {
    mediaId: entry.mediaId,
    title: entry.media?.title ?? "Untitled",
    year: entry.media?.year ?? undefined,
    type,
    statusLabel: statusLabel(entry.status, type),
    image: entry.media?.coverImage || undefined,
    hasProgress: episodic,
    current: entry.progress ?? 0,
    total: total ?? undefined,
    unit: shortUnit(entry.media?.unitName ?? entry.unitName, type),
  };
}

// authFetch handles a 401 reactively: the single-flight lazy refresh (shared
// with use-current-user, serialized in-process on the BFF by refresh token)
// rewrites the access cookie and the request is replayed once.
async function fetchContinueItems(): Promise<ContinueItem[]> {
  const response = await authFetch("/api/library/continue", { cache: "no-store" });
  if (!response.ok) throw new Error("load failed");

  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("load failed");
  return data.map(mapEntry).filter((item): item is ContinueItem => item !== null);
}

// Single-flight: while the initial fetch is in flight, a concurrent mount
// (e.g. React StrictMode's double mount in dev, or a rapid re-mount) reuses
// the same promise instead of firing a second request. The promise is cleared
// on settle, so a later visit to the page fetches fresh data.
let inFlightContinue: Promise<ContinueItem[]> | null = null;

function fetchContinueItemsOnce(): Promise<ContinueItem[]> {
  if (!inFlightContinue) {
    inFlightContinue = fetchContinueItems().finally(() => {
      inFlightContinue = null;
    });
  }
  return inFlightContinue;
}

function StepButton({
  label,
  onClick,
  disabled,
  busy,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  icon: typeof Minus;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md border border-line-2/70 text-ink-2",
        "transition-colors duration-150 motion-reduce:transition-none",
        "hover:bg-surface-3 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
    </button>
  );
}

export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-[54px] w-[42px] shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Skeleton className="h-2 w-16 rounded-full" />
          <Skeleton className="mt-3 h-3.5 w-4/5 rounded-full" />
          <div className="mt-auto pt-5">
            <Skeleton className="h-[3px] w-full rounded-full" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-2.5 w-20 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center rounded-xl border border-line bg-surface-2 px-6 py-12 text-center">
      <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        No active titles
      </span>
      <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
        Nothing in progress.
      </h3>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
        Start a series, pick up a game, or crack open a manga &mdash; anything
        you are working through will show up here.
      </p>
    </div>
  );
}

export default function ContinueList({ className }: { className?: string }) {
  const { user, loading } = useCurrentUser();
  const [items, setItems] = useState<ContinueItem[] | null>(null);
  const [error, setError] = useState(false);
  const [busyIds, setBusyIds] = useState<ReadonlySet<number>>(new Set());

  const load = useCallback(async () => {
    try {
      setItems(await fetchContinueItemsOnce());
      setError(false);
    } catch {
      setItems(null);
      setError(true);
    }
  }, []);

  // Wait for the session to resolve: by the time `user` is set, /api/auth/me
  // has already lazily renewed the access cookie when needed, so this fetch
  // goes out with a fresh token instead of spending a 401 + refresh cycle.
  // The user object also gains a new identity whenever a lazy rotation syncs
  // the profile, which refetches the list without visible skeleton flicker.
  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchContinueItemsOnce();
        if (cancelled) return;
        setItems(data);
        setError(false);
      } catch {
        if (cancelled) return;
        setItems(null);
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const step = useCallback(
    async (item: ContinueItem, delta: number) => {
      const total = item.total;
      const next = Math.min(total ?? Number.MAX_SAFE_INTEGER, Math.max(0, item.current + delta));
      if (next === item.current) return;

      setBusyIds((prev) => new Set(prev).add(item.mediaId));

      const post = () =>
        authFetch(`/api/library/${item.mediaId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress: next }),
        });

      const response = await post();
      if (response.ok) {
        const updated: unknown = await response.json().catch(() => null);
        setItems((prev) =>
          prev
            ? prev
                .map((existing) =>
                  existing.mediaId === item.mediaId
                    ? (mapEntry(updated as ContinueEntry) ?? null)
                    : existing,
                )
                .filter((entry): entry is ContinueItem => entry !== null)
            : prev,
        );
      }

      setBusyIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(item.mediaId);
        return nextSet;
      });
    },
    [],
  );

  if (error) {
    return (
      <div
        className={cn(
          "col-span-full flex flex-col items-center gap-4 rounded-xl border border-line bg-surface-2 px-6 py-10 text-center",
          className,
        )}
      >
        <p className="text-[13px] text-ink-2">
          Couldn&rsquo;t load what you are up to next.
        </p>
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
    );
  }

  // Not signed in (or the session lookup failed): nothing to list, and the
  // top bar already offers sign-in.
  if (!loading && user === null) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
        <EmptyState />
      </div>
    );
  }

  if (items === null) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => {
        const percent =
          item.hasProgress && item.total && item.total > 0
            ? Math.min(100, Math.round((item.current / item.total) * 100))
            : null;
        const busy = busyIds.has(item.mediaId);

        return (
          <article
            key={item.mediaId}
            className="rounded-xl border border-line bg-surface-2 p-4"
          >
            <div className="flex items-start gap-3">
              <MediaAvatarCard
                title={item.title}
                year={item.year}
                image={item.image}
                type={item.type}
                size="md"
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span className="truncate text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                    {item.statusLabel}
                  </span>
                </div>

                <p className="mt-1.5 truncate text-[15px] leading-tight font-semibold text-foreground">
                  {item.title}
                </p>

                <div className="mt-auto pt-3">
                  {item.hasProgress ? (
                    <>
                      {percent !== null ? (
                        <div
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${item.title} — ${item.current} of ${item.total} ${item.unit}`}
                          className="h-[3px] w-full overflow-hidden rounded-full bg-line"
                        >
                          <div
                            className="h-full rounded-full bg-foreground"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      ) : (
                        <div
                          aria-hidden="true"
                          className="h-[3px] w-full rounded-full bg-line"
                        />
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] leading-none text-ink-3">
                          {percent !== null && (
                            <span className="text-ink-2">{percent}% · </span>
                          )}
                          {item.total !== undefined
                            ? `${item.current}/${item.total} ${item.unit}`
                            : `${item.current} ${item.unit}`}
                        </span>

                        <div className="flex shrink-0 gap-1">
                          <StepButton
                            label={`Mark ${item.title} behind`}
                            icon={Minus}
                            disabled={item.current <= 0}
                            busy={busy}
                            onClick={() =>
                              void step(item, -1)
                            }
                          />
                          <StepButton
                            label={`Advance ${item.title}`}
                            icon={Plus}
                            disabled={item.total !== undefined && item.current >= item.total}
                            busy={busy}
                            onClick={() => void step(item, 1)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] leading-none text-ink-3">
                      {item.year !== undefined ? `${item.year}` : "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
