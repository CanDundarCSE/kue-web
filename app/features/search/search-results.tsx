"use client";

import { ArrowRight, Search, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import LibraryBadge from "@/app/components/library-badge";
import SectionLabel from "@/app/features/home/section-label";
import SearchPaginator from "@/app/features/search/search-paginator";
import { useLibraryPresence } from "@/lib/library-presence";
import { fetchSearchPage, mediaKey, type SearchMedia, type SearchSort } from "@/lib/search";
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

const SORTS: { value: string; label: string }[] = [
  { value: "", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Top rated" },
  { value: "lowest", label: "Lowest rated" },
];

const SCORE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any score" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
];

function RowMeta({ media }: { media: SearchMedia }) {
  const parts = [
    media.year !== null ? String(media.year) : null,
    mediaTypeLabel(media.mediaType),
  ].filter(Boolean);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="truncate">{parts.join(" · ")}</span>
      {media.score !== null && (
        <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-accent">
          <Star className="size-2.5 fill-current" aria-hidden="true" />
          {media.score}
        </span>
      )}
    </span>
  );
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
  inLibrary,
  onSelect,
}: {
  media: SearchMedia;
  inLibrary: boolean;
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
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-[14px] leading-tight font-semibold text-foreground group-hover:text-accent transition-colors">
              {media.title}
            </p>
            {inLibrary && <LibraryBadge variant="pill" />}
          </div>
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
  sort,
  year,
  minScore,
}: {
  query: string;
  type: string;
  page: number;
  sort: string;
  year: number | null;
  minScore: number | null;
}) {
  const router = useRouter();
  const { isInLibrary } = useLibraryPresence();

  const [items, setItems] = useState<SearchMedia[]>([]);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [lastPage, setLastPage] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const requestRef = useRef(0);

  const trimmed = query.trim();
  const hasRefinements = sort !== "" || year !== null || minScore !== null;

  const pushState = useCallback(
    (
      next: { type?: string; sort?: string; year?: number | null; minScore?: number | null; page?: number },
      options?: { replace?: boolean },
    ) => {
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      const nextType = next.type ?? type;
      if (nextType) params.set("type", nextType);
      const nextSort = next.sort ?? sort;
      if (nextSort) params.set("sort", nextSort);
      const nextYear = next.year !== undefined ? next.year : year;
      if (nextYear !== null) params.set("year", String(nextYear));
      const nextScore = next.minScore !== undefined ? next.minScore : minScore;
      if (nextScore !== null) params.set("minScore", String(nextScore));
      const nextPage = next.page ?? 1;
      if (nextPage > 1) params.set("page", String(nextPage));

      const href = `/home/search${params.size ? `?${params.toString()}` : ""}`;
      if (options?.replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    [router, trimmed, type, sort, year, minScore],
  );

  const pushPage = useCallback(
    (next: number, options?: { replace?: boolean }) => {
      pushState({ page: next }, options);
    },
    [pushState],
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

    const result = await fetchSearchPage(trimmed, type, page, PAGE_SIZE, {
      sort: (sort as SearchSort) || null,
      year,
      minScore,
    });
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
  }, [trimmed, type, page, sort, year, minScore, pushPage]);

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
    pushState({ type: value, page: 1 });
  };

  const applySort = (value: string) => {
    if (value === sort) return;
    pushState({ sort: value, page: 1 });
  };

  const applyYear = (value: number | null) => {
    if (value === year) return;
    pushState({ year: value, page: 1 });
  };

  const applyMinScore = (value: number | null) => {
    if (value === minScore) return;
    pushState({ minScore: value, page: 1 });
  };

  const clearRefinements = () => {
    if (!hasRefinements && !type) return;
    pushState({ type: "", sort: "", year: null, minScore: null, page: 1 });
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

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label="Sort results" className="flex flex-wrap items-center gap-1.5">
          {SORTS.map((option) => {
            const active = option.value === sort;
            return (
              <button
                key={option.value || "relevance"}
                type="button"
                aria-pressed={active}
                onClick={() => applySort(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-mono tracking-[0.08em] uppercase",
                  "transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <input
          key={year === null ? "year-any" : `year-${year}`}
          type="number"
          defaultValue={year ?? ""}
          min={1800}
          max={2100}
          placeholder="Year"
          aria-label="Filter by release year"
          onBlur={(event) => {
            const value = Number.parseInt(event.target.value, 10);
            applyYear(Number.isInteger(value) && value >= 1800 && value <= 2100 ? value : null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              event.currentTarget.blur();
            }
          }}
          className={cn(
            "h-[34px] w-24 rounded-full border border-line-2/70 bg-transparent px-3",
            "font-mono text-[11px] tracking-[0.08em] text-ink-2 placeholder:text-ink-3",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:border-line-2 hover:text-foreground",
            "focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none focus:text-foreground",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            year !== null && "border-accent/60 bg-accent/10 text-accent",
          )}
        />

        <select
          value={minScore === null ? "" : String(minScore)}
          onChange={(event) => {
            const value = Number(event.target.value);
            applyMinScore(event.target.value === "" ? null : value);
          }}
          aria-label="Filter by minimum score"
          className={cn(
            "h-[34px] w-28 cursor-pointer appearance-none rounded-full border border-line-2/70 bg-transparent pr-3 pl-3",
            "text-center font-mono text-[11px] tracking-[0.08em] uppercase",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            minScore !== null
              ? "border-accent/60 bg-accent/10 text-accent"
              : "text-ink-2 hover:text-foreground",
          )}
        >
          {SCORE_OPTIONS.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {(hasRefinements || type) && (
          <button
            type="button"
            onClick={clearRefinements}
            className={cn(
              "rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            Clear
          </button>
        )}
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
                    inLibrary={isInLibrary(media)}
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
