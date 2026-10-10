"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { authFetch } from "@/lib/api/client";
import type { LibraryEntryDto } from "@/lib/api/library";
import { cn } from "@/lib/utils";

const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);

// The picker only needs the fields it renders, so it pages the library the
// same way the favorites route does and trims to a flat list client-side.
const PAGE_SIZE = 100;
const MAX_PAGES = 25;

export type PickerMedia = {
  mediaId: number;
  title: string;
  type: MediaType;
  image?: string;
  /** The score already set on the library entry, 1-10. */
  rating?: number | null;
};

type LoadedLibrary = {
  items: PickerMedia[];
  truncated: boolean;
};

function asMediaType(value: string | undefined): MediaType {
  return value && MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : "movie";
}

function toPickerMedia(dto: LibraryEntryDto): PickerMedia | null {
  const title = dto.media?.title?.trim();
  if (!title) return null;

  return {
    mediaId: dto.mediaId,
    title,
    type: asMediaType(dto.mediaType || dto.media?.mediaType),
    image: dto.media?.coverImage || undefined,
    rating: typeof dto.rating === "number" ? dto.rating : null,
  };
}

async function fetchLibraryForPicker(): Promise<LoadedLibrary> {
  const collected: PickerMedia[] = [];
  let truncated = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await authFetch(
      `/api/library?page=${page}&pageSize=${PAGE_SIZE}`,
      { cache: "no-store" },
    ).catch(() => null);

    if (!response || !response.ok) {
      if (collected.length === 0) throw new Error("load failed");
      truncated = true;
      break;
    }

    const data = (await response.json().catch(() => null)) as {
      items?: LibraryEntryDto[];
      totalPages?: number;
    } | null;

    const entries = Array.isArray(data?.items) ? data.items : [];
    const mapped = entries
      .map(toPickerMedia)
      .filter((item): item is PickerMedia => item !== null);

    collected.push(...mapped);

    const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 1;
    if (page >= totalPages || entries.length === 0) break;
    if (page === MAX_PAGES) truncated = true;
  }

  // De-dupe: one review per media, so a duplicated row would be a dead entry.
  const seen = new Set<number>();
  const items = collected.filter((item) => {
    if (seen.has(item.mediaId)) return false;
    seen.add(item.mediaId);
    return true;
  });

  return { items, truncated };
}

export default function LibraryMediaPicker({
  value,
  reviewedMediaIds,
  onChange,
}: {
  value: PickerMedia | null;
  /** Media the user already reviewed - shown as disabled rows. */
  reviewedMediaIds: Set<number>;
  onChange: (media: PickerMedia) => void;
}) {
  const [library, setLibrary] = useState<LoadedLibrary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    // Deferred like the other features: the reset setState calls must not run
    // synchronously in the effect body.
    const handle = setTimeout(() => {
      setLibrary(null);
      setLoadError(null);

      void fetchLibraryForPicker()
        .then((data) => {
          if (!cancelled) setLibrary(data);
        })
        .catch(() => {
          if (!cancelled) setLoadError("Couldn&rsquo;t load your library.");
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    if (!library) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return library.items;
    return library.items.filter((item) => item.title.toLowerCase().includes(needle));
  }, [library, query]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your library"
          aria-label="Search your library for a title"
          className={cn(
            "h-10 w-full rounded-lg border border-line-2/70 bg-background pr-9 pl-9 text-[13px] text-foreground",
            "placeholder:text-ink-3",
            "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className={cn(
              "absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-3",
              "transition-colors hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="mt-3 max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface-2/60">
        {library === null && loadError === null && (
          <ul aria-hidden="true" className="divide-y divide-line">
            {[0, 1, 2, 3].map((index) => (
              <li key={index} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-11 w-[34px] shrink-0 rounded-lg" />
                <Skeleton className="h-3 w-2/5 rounded-full" />
              </li>
            ))}
          </ul>
        )}

        {loadError !== null && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <p className="text-[13px] text-ink-2">{loadError}</p>
            <button
              type="button"
              onClick={reload}
              className="rounded-md border border-line-2/70 px-3 py-1.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              Try again
            </button>
          </div>
        )}

        {library !== null && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
              {library.items.length === 0 ? "Library is empty" : "No matches"}
            </span>
            <p className="max-w-xs text-[13px] leading-relaxed text-ink-2">
              {library.items.length === 0
                ? "Add titles to your library first, then come back to review them."
                : "Try a different spelling."}
            </p>
          </div>
        )}

        {library !== null && filtered.length > 0 && (
          <>
            {library.truncated && (
              <p className="border-b border-line px-3 py-2 text-[11px] leading-relaxed text-ink-3">
                Showing your first {PAGE_SIZE * MAX_PAGES} library titles.
              </p>
            )}
            <ul role="listbox" aria-label="Library titles" className="divide-y divide-line">
              {filtered.map((item) => {
                const alreadyReviewed = reviewedMediaIds.has(item.mediaId);
                const selected = value?.mediaId === item.mediaId;

                return (
                  <li key={item.mediaId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={alreadyReviewed}
                      onClick={() => onChange(item)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                        "transition-colors duration-150 motion-reduce:transition-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30",
                        alreadyReviewed
                          ? "cursor-not-allowed opacity-45"
                          : "hover:bg-surface-3/60",
                      )}
                    >
                      <MediaAvatarCard
                        title={item.title}
                        image={item.image}
                        type={item.type}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                        {item.title}
                      </span>
                      {selected ? (
                        <Check className="size-4 shrink-0 text-accent" strokeWidth={2} />
                      ) : alreadyReviewed ? (
                        <span className="shrink-0 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                          Reviewed
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export function PickerSpinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
      {label}
    </span>
  );
}