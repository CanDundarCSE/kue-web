"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import SectionLabel from "@/app/features/home/section-label";
import {
  addToLibraryFromDiscover,
  fetchDiscover,
  fetchTopRated,
  type DiscoverData,
  type TopRatedItem,
} from "@/lib/api/discover";
import type { SearchMedia } from "@/lib/search";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

function asMediaType(value: string): MediaType {
  return MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

function mediaTypeLabel(value: string): string {
  switch (value) {
    case "anime":
      return "Anime";
    case "series":
      return "Series";
    case "manga":
      return "Manga";
    case "game":
      return "Game";
    default:
      return "Film";
  }
}

// Subtitle shown in the right-panel ranked rows: "FILM · 8.5 RATING"
function buildMeta(media: SearchMedia): string {
  const parts: string[] = [mediaTypeLabel(media.mediaType)];
  if (media.score !== null && media.score !== undefined)
    parts.push(`${media.score} Rating`);
  return parts.join(" · ").toUpperCase();
}

// Subtitle shown in the left-panel compact rows: "ANIME · 2026"
function buildRowSubtitle(media: SearchMedia): string {
  const parts: string[] = [mediaTypeLabel(media.mediaType)];
  if (media.year !== null && media.year !== undefined) parts.push(String(media.year));
  return parts.join(" · ").toUpperCase();
}

// ---------------------------------------------------------------------------
// Add-button state machine
// ---------------------------------------------------------------------------

type AddState = "idle" | "loading" | "done" | "error";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function RowSkeleton() {
  return (
    <li aria-hidden="true" className="flex items-center gap-4 rounded-lg p-3">
      <div className="h-[54px] w-[42px] shrink-0 animate-pulse rounded-lg bg-surface-3" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-surface-3" />
        <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-surface-3" />
      </div>
      <div className="size-8 shrink-0 animate-pulse rounded-lg bg-surface-3" />
    </li>
  );
}

function RankSkeleton() {
  return (
    <li aria-hidden="true" className="flex items-center gap-4 px-4 py-3.5">
      <div className="w-5 shrink-0 animate-pulse rounded-full bg-surface-3 h-3" />
      <div className="h-[54px] w-[42px] shrink-0 animate-pulse rounded-lg bg-surface-3" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-surface-3" />
        <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-surface-3" />
      </div>
      <div className="size-8 shrink-0 animate-pulse rounded-lg bg-surface-3" />
    </li>
  );
}

// ---------------------------------------------------------------------------
// AddButton
// ---------------------------------------------------------------------------

function AddButton({
  media,
  onDone,
}: {
  media: SearchMedia;
  onDone?: () => void;
}) {
  const [state, setState] = useState<AddState>("idle");

  const handleAdd = async () => {
    if (state !== "idle") return;
    setState("loading");

    const ok = await addToLibraryFromDiscover(media);
    if (ok) {
      setState("done");
      onDone?.();
    } else {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  return (
    <button
      type="button"
      aria-label={
        state === "done"
          ? `${media.title} added to library`
          : `Add ${media.title} to library`
      }
      disabled={state === "loading" || state === "done"}
      onClick={handleAdd}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        state === "done"
          ? "border-transparent bg-transparent text-accent"
          : state === "error"
            ? "border-red-400/50 text-red-400"
            : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
        "disabled:pointer-events-none",
      )}
    >
      {state === "loading" ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={2} />
      ) : state === "done" ? (
        <Check className="size-4" strokeWidth={2.5} />
      ) : (
        <Plus className="size-4" strokeWidth={2} />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Left panel — main trending list (compact)
// ---------------------------------------------------------------------------

function TrendingRow({
  media,
  onClick,
}: {
  media: SearchMedia;
  onClick: () => void;
}) {
  return (
    <li className="group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-surface-2">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:outline-none"
      >
        <MediaAvatarCard
          title={media.title}
          year={media.year ?? undefined}
          image={media.coverImage ?? undefined}
          type={asMediaType(media.mediaType)}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-snug font-semibold text-foreground transition-colors group-hover:text-accent">
            {media.title}
          </p>
          <p className="mt-1 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
            <span
              className={cn(
                "mr-1.5 inline-block size-2 rounded-full",
                `bg-media-${asMediaType(media.mediaType)}`,
              )}
              aria-hidden="true"
            />
            {buildRowSubtitle(media)}
          </p>
        </div>
      </button>

      <AddButton media={media} />
    </li>
  );
}

// ---------------------------------------------------------------------------
// Right panel — ranked list
// ---------------------------------------------------------------------------

function RankedRow({
  rank,
  media,
  onClick,
}: {
  rank: number;
  media: SearchMedia;
  onClick: () => void;
}) {
  return (
    <li className="group flex items-center gap-4 border-b border-line/60 px-4 py-3.5 last:border-b-0 transition-colors hover:bg-surface-2/60">
      <span className="w-5 shrink-0 text-[12px] font-mono tabular-nums text-ink-3">
        {String(rank).padStart(2, "0")}
      </span>

      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left focus-visible:outline-none"
      >
        <MediaAvatarCard
          title={media.title}
          year={media.year ?? undefined}
          image={media.coverImage ?? undefined}
          type={asMediaType(media.mediaType)}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-snug font-semibold text-foreground transition-colors group-hover:text-accent">
            {media.title}
          </p>
          <p className="mt-0.5 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
            {buildMeta(media)}
          </p>
        </div>
      </button>

      <AddButton media={media} />
    </li>
  );
}

// ---------------------------------------------------------------------------
// Search bar
// ---------------------------------------------------------------------------

function DiscoverSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    router.push(`/home/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <input
      type="search"
      aria-label="Search by title, author or genre"
      placeholder="Search by title, author or genre..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
      }}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-surface-2/60 px-4",
        "text-[14px] text-foreground placeholder:text-ink-3",
        "transition-colors duration-150 motion-reduce:transition-none",
        "hover:border-line-2",
        "focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none",
        "[&::-webkit-search-cancel-button]:hidden",
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function DiscoverView({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();

  // ── Top-rated (left panel) ───────────────────────────────────────────────
  const [topRated, setTopRated] = useState<TopRatedItem[]>([]);
  const [topRatedState, setTopRatedState] = useState<"loading" | "ready" | "error">("loading");

  // ── Trending (right panel) ───────────────────────────────────────────────
  const [discoverData, setDiscoverData] = useState<DiscoverData | null>(null);
  const [trendingState, setTrendingState] = useState<"loading" | "ready" | "error">("loading");

  const mounted = useRef(true);

  const loadTopRated = useCallback(async () => {
    setTopRatedState("loading");
    try {
      const items = await fetchTopRated(10);
      if (!mounted.current) return;
      setTopRated(items);
      setTopRatedState("ready");
    } catch {
      if (!mounted.current) return;
      setTopRatedState("error");
    }
  }, []);

  const loadTrending = useCallback(async () => {
    setTrendingState("loading");
    try {
      const result = await fetchDiscover();
      if (!mounted.current) return;
      setDiscoverData(result);
      setTrendingState("ready");
    } catch {
      if (!mounted.current) return;
      setTrendingState("error");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const handle = setTimeout(() => {
      void loadTopRated();
      void loadTrending();
    }, 0);
    return () => {
      mounted.current = false;
      clearTimeout(handle);
    };
  }, [loadTopRated, loadTrending]);

  const goToMedia = (media: SearchMedia) => {
    if (typeof media.id === "number" && media.id > 0) {
      router.push(`/media/${media.id}`);
      return;
    }
    const params = new URLSearchParams();
    if (media.externalSource) params.set("source", media.externalSource);
    if (media.externalId) params.set("id", media.externalId);
    params.set("type", media.mediaType);
    router.push(`/media/ext?${params.toString()}`);
  };

  const allTrending = discoverData?.trending ?? [];
  const returning = discoverData?.returning ?? [];

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* ── Page header ─────────────────────────────────────────── */}
      <section aria-labelledby="discover-heading">
        <SectionLabel>Discover</SectionLabel>

        <h1
          id="discover-heading"
          className="mt-5 font-serif text-[clamp(30px,4.5vw,46px)] leading-[1.05] tracking-[-0.01em] text-foreground"
        >
          Find it once<span className="text-accent">.</span>
        </h1>

        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-2">
          Films, series, games, anime and manga in a single search — synced
          nightly from TMDB, AniList and IGDB.
        </p>
      </section>

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="mt-8">
        <DiscoverSearch initialQuery={initialQuery} />
      </div>

      {/* ── Two-column grid ─────────────────────────────────────── */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* ── Left — top-rated ──────────────────────────────────── */}
        <div>
          <SectionLabel>Top rated media</SectionLabel>

          <div className="mt-4 rounded-xl border border-line bg-surface-2/40">
            {topRatedState === "loading" && (
              <ul>
                {Array.from({ length: 5 }).map((_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </ul>
            )}

            {topRatedState === "error" && (
              <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                <p className="text-[13px] text-ink-2">Couldn&rsquo;t load top-rated titles.</p>
                <button
                  type="button"
                  onClick={() => void loadTopRated()}
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
            )}

            {topRatedState === "ready" && topRated.length === 0 && (
              <p className="px-6 py-12 text-center text-[13px] text-ink-2">
                No top-rated titles right now.
              </p>
            )}

            {topRatedState === "ready" && topRated.length > 0 && (
              <ul className="p-2">
                {topRated.map((item) => (
                  <TrendingRow
                    key={item.rank}
                    media={item}
                    onClick={() => goToMedia(item)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right — trending chart + returning soon ──────────── */}
        <div className="flex flex-col gap-4">
          {/* Ranked trending chart */}
          <div className="rounded-xl border border-line bg-surface-2/40 overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <SectionLabel>Trending this week</SectionLabel>
            </div>

            {trendingState === "loading" && (
              <ul>
                {Array.from({ length: 5 }).map((_, i) => (
                  <RankSkeleton key={i} />
                ))}
              </ul>
            )}

            {trendingState === "error" && (
              <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
                <p className="text-[13px] text-ink-2">Couldn&rsquo;t load trending titles.</p>
                <button
                  type="button"
                  onClick={() => void loadTrending()}
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
            )}

            {trendingState === "ready" && allTrending.length > 0 && (
              <ul>
                {allTrending.map((item) => (
                  <RankedRow
                    key={item.rank}
                    rank={item.rank}
                    media={item}
                    onClick={() => goToMedia(item)}
                  />
                ))}
              </ul>
            )}

            {trendingState === "ready" && allTrending.length === 0 && (
              <p className="px-4 py-8 text-center text-[13px] text-ink-2">No data yet.</p>
            )}
          </div>

          {/* Returning soon */}
          {(trendingState === "loading" || returning.length > 0) && (
            <div className="rounded-xl border border-line bg-surface-2/40 overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <SectionLabel>Returning soon</SectionLabel>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {trendingState === "loading" &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="h-7 w-36 animate-pulse rounded-full bg-surface-3"
                    />
                  ))}
                {trendingState === "ready" &&
                  returning.map((item) => (
                    <span
                      key={item.title}
                      className={cn(
                        "inline-flex items-center rounded-full border border-line-2/60 px-3 py-1",
                        "text-[10px] font-mono tracking-[0.1em] text-ink-2 uppercase",
                      )}
                    >
                      {item.title}
                      {item.note ? ` — ${item.note}` : ""}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
