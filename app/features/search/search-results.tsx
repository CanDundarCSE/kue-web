"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import SectionLabel from "@/app/features/home/section-label";
import SearchPaginator from "@/app/features/search/search-paginator";
import { fetchSearchPage, mediaKey, type SearchMedia } from "@/lib/search";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

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
      return "Movie";
  }
}

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
  { value: "game", label: "Games" },
  { value: "anime", label: "Anime" },
  { value: "manga", label: "Manga" },
];

function RowMeta({ media }: { media: SearchMedia }) {
  const parts = [
    media.year !== null ? String(media.year) : null,
    mediaTypeLabel(media.mediaType),
    media.score !== null ? `${media.score}` : null,
  ].filter(Boolean);

  return <>{parts.join(" · ")}</>;
}

function RowSkeleton() {
  return (
    <li aria-hidden="true" className="flex items-center gap-3.5 px-4 py-3">
      <div className="h-[54px] w-[42px] shrink-0 animate-pulse rounded-lg bg-surface-3" />
      <div className="min-w-0 flex-1">
        <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-surface-3" />
        <div className="mt-2 h-2.5 w-1/5 animate-pulse rounded-full bg-surface-3" />
        <div className="mt-2 hidden h-2.5 w-3/5 animate-pulse rounded-full bg-surface-3 sm:block" />
      </div>
      <div className="size-7 shrink-0 animate-pulse rounded-md bg-surface-3" />
    </li>
  );
}

function ResultRow({
  media,
  onSelect,
}: {
  media: SearchMedia;
  onSelect: () => void;
}) {
  return (
    <li className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-surface-3/50">
      <button
        type="button"
        onClick={onSelect}
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
          <p className="truncate text-[14px] leading-tight font-semibold text-foreground group-hover:text-accent transition-colors">
            {media.title}
          </p>
          <p className="mt-1 text-[11px] leading-none text-ink-3">
            <RowMeta media={media} />
          </p>
          {media.description && (
            <p className="mt-1.5 hidden truncate text-[12px] leading-snug text-ink-3 sm:line-clamp-2 sm:block">
              {media.description}
            </p>
          )}
        </div>
      </button>

      <button
        type="button"
        aria-label={`View details for ${media.title}`}
        onClick={onSelect}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg border border-line-2/70 text-ink-2",
          "transition-colors duration-150 motion-reduce:transition-none",
          "hover:bg-surface-3 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        )}
      >
        <ArrowRight className="size-4" strokeWidth={2} />
      </button>
    </li>
  );
}

export default function SearchResults({
  query,
  type,
  page,
}: {
  query: string;
  type: string;
  page: number;
}) {
  const router = useRouter();

  const [items, setItems] = useState<SearchMedia[]>([]);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [lastPage, setLastPage] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const requestRef = useRef(0);

  const trimmed = query.trim();

  const pushPage = useCallback(
    (next: number, options?: { replace?: boolean }) => {
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      if (type) params.set("type", type);
      if (next > 1) params.set("page", String(next));

      const href = `/home/search${params.size ? `?${params.toString()}` : ""}`;
      if (options?.replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    [router, trimmed, type],
  );

  // The URL is the source of truth (top bar, filter pills, pager and
  // back/forward all land here), so refetch whenever query, filter or page
  // changes.
  const reload = useCallback(async () => {
    if (!trimmed) {
      // Invalidate any in-flight page loads from the previous query.
      requestRef.current++;
      setItems([]);
      setTotalItems(null);
      setLastPage(0);
      setState("idle");
      return;
    }

    const requestId = ++requestRef.current;
    setState("loading");

    const result = await fetchSearchPage(trimmed, type, page, PAGE_SIZE);
    if (requestId !== requestRef.current) return;

    if (!result) {
      setState("error");
      return;
    }

    // An out-of-range page (results shrank, stale bookmark) falls back to the
    // last page that actually has rows.
    if (page > result.totalPages && result.totalPages >= 1) {
      requestRef.current++;
      setState("idle");
      pushPage(result.totalPages, { replace: true });
      return;
    }

    setItems(result.items);
    setTotalItems(result.totalItems);
    setCurrentPage(page);
    setLastPage(result.totalPages);
    setState("ready");
    window.scrollTo(0, 0);
  }, [trimmed, type, page, pushPage]);

  // Deferred like the top-bar dropdown: the reset/loading setState calls must
  // not run synchronously in the effect body.
  useEffect(() => {
    const handle = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(handle);
  }, [reload]);

  const goToPage = (next: number) => {
    if (state !== "ready" || next === currentPage) return;
    if (next < 1 || next > lastPage) return;
    pushPage(next);
  };

  const applyFilter = (value: string) => {
    if (value === type) return;

    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (value) params.set("type", value);
    router.push(`/home/search?${params.toString()}`);
  };

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

  const activeFilterLabel = FILTERS.find((filter) => filter.value === type)?.label ?? null;

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <section aria-labelledby="search-heading">
        <SectionLabel>{trimmed ? "Search results" : "Search"}</SectionLabel>

        <h1
          id="search-heading"
          className="mt-5 font-serif text-[clamp(28px,4vw,40px)] leading-[1.08] tracking-[-0.01em] text-foreground"
        >
          {trimmed ? (
            <>
              Results for <span className="text-accent">&ldquo;{trimmed}&rdquo;</span>
            </>
          ) : (
            <>
              Search the catalog<span className="text-accent">.</span>
            </>
          )}
        </h1>

        {trimmed && totalItems !== null && (
          <p className="mt-3 text-[14px] text-ink-2">
            {totalItems} {totalItems === 1 ? "title" : "titles"} in the catalog
            {activeFilterLabel ? ` · ${activeFilterLabel}` : ""}.
          </p>
        )}
      </section>

      <div
        role="group"
        aria-label="Filter by type"
        className="mt-6 flex flex-wrap gap-1.5"
      >
        {FILTERS.map((filter) => {
          const active = filter.value === type;
          return (
            <button
              key={filter.value || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => applyFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-mono tracking-[0.08em] uppercase",
                "transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                active
                  ? "border-transparent bg-foreground text-background"
                  : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {state === "idle" && (
          <div className="flex flex-col items-center rounded-xl border border-line bg-surface-2 px-6 py-14 text-center">
            <Search className="size-5 text-ink-3" strokeWidth={1.75} />
            <h3 className="mt-4 font-serif text-xl leading-tight text-foreground">
              Nothing to show yet.
            </h3>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
              Type a title in the search bar above &mdash; movies, series, games,
              anime and manga are all in one catalog.
            </p>
          </div>
        )}

        {state === "loading" && (
          <ul aria-hidden="true" className="divide-y divide-line rounded-xl border border-line bg-surface-2/60">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </ul>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface-2 px-6 py-12 text-center">
            <p className="text-[13px] text-ink-2">Couldn&rsquo;t search the catalog.</p>
            <button
              type="button"
              onClick={() => void reload()}
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

        {state === "ready" && items.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-line bg-surface-2 px-6 py-14 text-center">
            <h3 className="font-serif text-xl leading-tight text-foreground">
              No matches for &ldquo;{trimmed}&rdquo;.
            </h3>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
              Check the spelling, try the original title, or browse another
              format with the filters above.
            </p>
          </div>
        )}

        {state === "ready" && items.length > 0 && (
          <>
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface-2/60">
              {items.map((media, index) => {
                const rowKey = mediaKey(media, index);
                return (
                  <ResultRow
                    key={rowKey}
                    media={media}
                    onSelect={() => goToMedia(media)}
                  />
                );
              })}
            </ul>

            <div className="mt-6 flex justify-center">
              {totalItems !== null && totalItems > 0 && (
                <p className="text-[11px] leading-none text-ink-3">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {(currentPage - 1) * PAGE_SIZE + items.length} of {totalItems}
                </p>
              )}
            </div>

            <SearchPaginator
              currentPage={currentPage}
              totalPages={lastPage}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
