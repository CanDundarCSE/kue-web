"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { mediaKey, type SearchMedia } from "@/lib/search";
import { cn } from "@/lib/utils";

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

function ResultMeta({ media }: { media: SearchMedia }) {
  const parts = [
    media.year !== null ? String(media.year) : null,
    mediaTypeLabel(media.mediaType),
    media.score !== null ? `${media.score}` : null,
  ].filter(Boolean);

  return <>{parts.join(" · ")}</>;
}

export default function SearchField() {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMedia[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestRef = useRef(0);

  const trimmed = query.trim();
  const searchable = trimmed.length >= 2;

  // "/" focuses the field from anywhere (unless already typing).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close on click outside the field + panel.
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Debounced catalog search. The empty-query reset is scheduled in the same
  // callback so no setState runs synchronously in the effect body.
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!searchable) {
        setResults([]);
        setState("idle");
        return;
      }

      const requestId = ++requestRef.current;
      setState("loading");

      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      }).catch(() => null);

      if (requestId !== requestRef.current) return;

      if (!response || !response.ok) {
        setState("error");
        return;
      }

      const data: unknown = await response.json().catch(() => null);
      if (requestId !== requestRef.current) return;

      const items = (data as { items?: SearchMedia[] } | null)?.items;
      setResults(Array.isArray(items) ? items : []);
      setState("ready");
      setActiveIndex(-1);
    }, 300);

    return () => clearTimeout(handle);
  }, [trimmed, searchable]);

  const goToMedia = (media: SearchMedia) => {
    setOpen(false);
    setActiveIndex(-1);

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

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (!open || !searchable) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        goToMedia(results[activeIndex]);
      } else if (trimmed) {
        // No highlighted result: open the full result set on the search page.
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        router.push(`/home/search?q=${encodeURIComponent(trimmed)}`);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showPanel = open && searchable;

  return (
    <div ref={containerRef} className="relative w-40 sm:w-56 lg:w-64">
      <Search
        aria-hidden="true"
        strokeWidth={1.75}
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
      />
      <input
        ref={inputRef}
        type="search"
        name="search"
        role="combobox"
        aria-label="Search titles"
        aria-expanded={showPanel}
        aria-controls="search-results"
        aria-autocomplete="list"
        placeholder="Search..."
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface-2/60 pr-9 pl-9",
          "text-[13px] text-foreground transition-colors duration-150 motion-reduce:transition-none",
          "placeholder:text-ink-3",
          "hover:border-line-2",
          "focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      <kbd
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-2 hidden h-[18px] -translate-y-1/2",
          "items-center justify-center rounded border border-line-2/70 px-1.5",
          "font-mono text-[10px] leading-none text-ink-3 sm:flex",
        )}
      >
        /
      </kbd>

      {showPanel && (
        <div
          id="search-results"
          className="absolute top-full right-0 z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-background shadow-[var(--shadow)]"
        >
          <p className="flex items-center gap-3 border-b border-line px-3.5 py-2.5 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
            <span>Results</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </p>

          <div className="max-h-80 overflow-y-auto p-1.5">
            {state === "loading" && (
              <ul aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <li key={index} className="flex items-center gap-2.5 px-2 py-2">
                    <div className="h-11 w-[34px] shrink-0 animate-pulse rounded-lg bg-surface-3" />
                    <div className="flex-1">
                      <div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-3" />
                      <div className="mt-2 h-2 w-1/2 animate-pulse rounded-full bg-surface-3" />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {state === "error" && (
              <p className="px-2 py-4 text-center text-[13px] text-ink-3">
                Couldn&rsquo;t search the catalog.
              </p>
            )}

            {state === "ready" && results.length === 0 && (
              <p className="px-2 py-4 text-center text-[13px] text-ink-3">
                No matches for &ldquo;{trimmed}&rdquo;.
              </p>
            )}

            {state === "ready" && results.length > 0 && (
              <ul role="listbox" aria-label="Search results">
                {results.map((media, index) => {
                  const key = mediaKey(media, index);

                  return (
                    <li
                      key={key}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors",
                        index === activeIndex ? "bg-surface-3" : "hover:bg-surface-3",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => goToMedia(media)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none"
                      >
                        <MediaAvatarCard
                          title={media.title}
                          year={media.year ?? undefined}
                          image={media.coverImage ?? undefined}
                          type={asMediaType(media.mediaType)}
                          size="sm"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] leading-tight font-medium text-foreground">
                            {media.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] leading-none text-ink-3">
                            <ResultMeta media={media} />
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-label={`View details for ${media.title}`}
                        onClick={() => goToMedia(media)}
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-md border border-line-2/70 text-ink-2",
                          "transition-colors duration-150 motion-reduce:transition-none",
                          "hover:bg-surface-3 hover:text-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                        )}
                      >
                        <ArrowRight className="size-3.5" strokeWidth={2} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {state === "ready" && results.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setActiveIndex(-1);
                router.push(`/home/search?q=${encodeURIComponent(trimmed)}`);
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t border-line px-3 py-2.5 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              See all results
              <ArrowRight className="size-3" strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
