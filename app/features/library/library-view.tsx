"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import MediaLibraryRow, { LIBRARY_GRID_LAYOUT } from "@/app/components/media-library-row";
import { type MediaType } from "@/app/components/media-avatar-card";
import LibraryEntrySheet, { type EditableLibraryItem } from "@/app/features/library/library-entry-sheet";
import { Skeleton } from "@/app/components/ui/skeleton";
import { authFetch } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";
import type { LibraryEntryDto, PagedResponseDto } from "@/lib/api/library";

type TabType = "all" | MediaType;

type StatusFilter = "all" | "in_progress" | "on_hold" | "planning" | "completed" | "dropped";

type SortOption = "recently_touched" | "title" | "progress" | "rating";

const PAGE_SIZE = 20;

const TABS: { id: TabType; label: string; mediaType?: MediaType }[] = [
  { id: "all", label: "ALL" },
  { id: "movie", label: "FILM", mediaType: "movie" },
  { id: "series", label: "SERIES", mediaType: "series" },
  { id: "game", label: "GAME", mediaType: "game" },
  { id: "anime", label: "ANIME", mediaType: "anime" },
  { id: "manga", label: "MANGA", mediaType: "manga" },
];

const STATUS_PILLS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "ALL STATUSES" },
  { id: "in_progress", label: "IN PROGRESS" },
  { id: "on_hold", label: "ON HOLD" },
  { id: "planning", label: "PLANNED" },
  { id: "completed", label: "DONE" },
  { id: "dropped", label: "DROPPED" },
];

const SORT_OPTIONS: { id: SortOption; label: string; menuLabel: string }[] = [
  { id: "recently_touched", label: "RECENTLY TOUCHED", menuLabel: "Recently touched" },
  { id: "title", label: "TITLE A–Z", menuLabel: "Title A–Z" },
  { id: "progress", label: "MOST PROGRESS", menuLabel: "Most progress" },
  { id: "rating", label: "HIGHEST RATED", menuLabel: "Highest rated" },
];

function formatCountSubtitle(totalCount: number, formatCount: number) {
  if (totalCount === 0) {
    return "0 titles in your library — one list, one scale.";
  }
  const formatWords: Record<number, string> = {
    1: "one format",
    2: "two formats",
    3: "three formats",
    4: "four formats",
    5: "five formats",
  };
  const formatsText = formatWords[formatCount] ?? `${formatCount} formats`;
  return `${totalCount} ${totalCount === 1 ? "title" : "titles"} across ${formatsText} — one list, one scale.`;
}

function normalizeUnit(unitName: string | null | undefined, type: MediaType): string {
  if (unitName) {
    const lower = unitName.toLowerCase();
    if (lower.includes("chapter")) return "ch";
    if (lower.includes("episode")) return "ep";
    if (lower.includes("hour")) return "h";
  }
  if (type === "manga") return "ch";
  if (type === "game") return "h";
  if (type === "movie") return "film";
  return "ep";
}

function mapDtoToEditable(dto: LibraryEntryDto): EditableLibraryItem {
  const type = (dto.mediaType || dto.media.mediaType || "movie") as MediaType;
  const current = dto.progress ?? (dto.status === "completed" ? (dto.totalUnits ?? 1) : 0);
  const total = dto.totalUnits ?? dto.media.totalUnits ?? undefined;
  const unit = normalizeUnit(dto.unitName ?? dto.media.unitName, type);

  return {
    mediaId: dto.mediaId,
    title: dto.media?.title ?? "Untitled",
    year: dto.media?.year ?? undefined,
    studio: dto.platform ?? dto.media?.platforms?.[0] ?? undefined,
    image: dto.media?.coverImage ?? undefined,
    type,
    status: dto.status,
    current,
    total,
    unit,
     rating: dto.rating ?? null,
    isFavorite: dto.isFavorite ?? false,
    platform: dto.platform ?? null,
    platforms: dto.media?.platforms ?? undefined,
  };
}

type StatsOverviewResponse = {
  totalItems: number;
  anime?: { total: number };
  manga?: { total: number };
  movie?: { total: number };
  series?: { total: number };
  game?: { total: number };
};

export function RowSkeleton() {
  return (
    <div className={cn("w-full border-b border-zinc-200 py-3.5 dark:border-zinc-800/80", LIBRARY_GRID_LAYOUT)}>
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-[54px] w-[42px] shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="hidden lg:block">
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="hidden lg:block">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div />
    </div>
  );
}

export function LibrarySkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Header Section Skeleton */}
      <header className="mb-8">
        <Skeleton className="h-3 w-16 rounded-sm" />
        <Skeleton className="mt-3 h-10 w-80 max-w-[80vw] sm:h-12" />
        <Skeleton className="mt-3 h-4 w-44" />
      </header>

      {/* Media Type Tabs Skeleton */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 sm:gap-8 pb-3">
        {["ALL", "FILM", "SERIES", "GAME", "ANIME", "MANGA"].map((tab) => (
          <div key={tab} className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-4" />
          </div>
        ))}
      </div>

      {/* Filter and Sort Row Skeleton */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* Table Container Skeleton */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950/40">
        <div
          className={cn(
            "border-b border-zinc-200 bg-[#fafaf8] py-3 font-mono text-[10px] tracking-[0.16em] uppercase text-zinc-400 dark:border-zinc-800/80 dark:bg-transparent dark:text-zinc-500",
            LIBRARY_GRID_LAYOUT,
          )}
        >
          <div>TITLE</div>
          <div className="hidden lg:block">STATUS</div>
          <div className="hidden lg:block">PROGRESS</div>
          <div className="text-center">RATING</div>
          <div />
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      </div>
    </div>
  );
}

export default function LibraryView() {
  const { user, loading: authLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [activeSort, setActiveSort] = useState<SortOption>("recently_touched");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<EditableLibraryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<EditableLibraryItem | null>(null);

  // Tab counts from backend overview stats
  const [tabCounts, setTabCounts] = useState<Record<TabType, number>>({
    all: 0,
    movie: 0,
    series: 0,
    game: 0,
    anime: 0,
    manga: 0,
  });

  // Close sort menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch("/api/stats/overview", { cache: "no-store" });
      if (res.ok) {
        const stats: StatsOverviewResponse = await res.json();
        setTabCounts({
          all: stats.totalItems,
          movie: stats.movie?.total ?? 0,
          series: stats.series?.total ?? 0,
          game: stats.game?.total ?? 0,
          anime: stats.anime?.total ?? 0,
          manga: stats.manga?.total ?? 0,
        });
      }
    } catch {
      // Ignore background sync errors
    }
  }, [user]);

  // Fetch overview stats on mount / auth change
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await authFetch("/api/stats/overview", { cache: "no-store" });
        if (cancelled || !res.ok) return;
        const stats: StatsOverviewResponse = await res.json();
        if (cancelled) return;
        setTabCounts({
          all: stats.totalItems,
          movie: stats.movie?.total ?? 0,
          series: stats.series?.total ?? 0,
          game: stats.game?.total ?? 0,
          anime: stats.anime?.total ?? 0,
          manga: stats.manga?.total ?? 0,
        });
      } catch {
        // Fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Fetch real library items from backend with pageSize = 20
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (activeTab !== "all") {
          queryParams.set("type", activeTab);
        }

        if (activeStatus !== "all") {
          queryParams.set("status", activeStatus);
        }

        const res = await authFetch(`/api/library?${queryParams.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load library");

        const data: PagedResponseDto<LibraryEntryDto> = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.items)) {
          setItems(data.items.map(mapDtoToEditable));
          setTotalItems(data.totalItems);
          setTotalPages(Math.max(1, data.totalPages));
        } else {
          setItems([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch {
        if (cancelled) return;
        setItems([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, activeTab, activeStatus, page]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleStatusChange = (statusId: StatusFilter) => {
    setActiveStatus(statusId);
    setPage(1);
  };

  const handleResetFilters = () => {
    setActiveTab("all");
    setActiveStatus("all");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Sort current items
  const sortedItems = useMemo(() => {
    const list = [...items];
    switch (activeSort) {
      case "title":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "progress":
        return list.sort((a, b) => {
          const aPct = a.total && a.total > 0 ? a.current / a.total : 0;
          const bPct = b.total && b.total > 0 ? b.current / b.total : 0;
          return bPct - aPct;
        });
      case "rating":
        return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "recently_touched":
      default:
        return list;
    }
  }, [items, activeSort]);

  // Save handler: persists to backend
  const handleSaveItem = async (updated: EditableLibraryItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.mediaId === updated.mediaId
          ? {
              ...updated,
              studio: updated.platform ?? updated.studio,
            }
          : i,
      ),
    );

    try {
      await authFetch(`/api/library/${updated.mediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updated.status,
          progress: updated.current,
          rating: updated.rating,
          isFavorite: updated.isFavorite,
          platform: updated.platform ?? "",
        }),
      });
      void refreshStats();
    } catch {
      // Ignore background sync errors
    }
  };

  // Delete handler: persists to backend
  const handleDeleteItem = async (mediaId: number) => {
    setItems((prev) => prev.filter((i) => i.mediaId !== mediaId));
    setTotalItems((prev) => Math.max(0, prev - 1));

    try {
      await authFetch(`/api/library/${mediaId}`, {
        method: "DELETE",
      });
      void refreshStats();
    } catch {
      // Ignore background sync errors
    }
  };

  const activeSortLabel = SORT_OPTIONS.find((o) => o.id === activeSort)?.label ?? "RECENTLY TOUCHED";
  const uniqueFormatsCount = useMemo(() => {
    const counts = [tabCounts.movie, tabCounts.series, tabCounts.game, tabCounts.anime, tabCounts.manga];
    return Math.max(1, counts.filter((c) => c > 0).length);
  }, [tabCounts]);

  if (authLoading) {
    return <LibrarySkeleton />;
  }

  // If signed out, display clean prompt to sign in
  if (user === null) {
    return (
      <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center px-5 py-24 text-center sm:px-8">
        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 dark:text-zinc-500 uppercase">
          Library
        </span>
        <h1 className="mt-4 font-serif text-[28px] leading-tight text-zinc-900 dark:text-zinc-50">
          Sign in to view your library<span className="text-[#3b5bf5] dark:text-[#6b7bf5]">.</span>
        </h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Films, series, games, anime, and manga live here once you are signed in.
        </p>
        <Link
          href="/login"
          className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Header Section */}
      <header className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
          LIBRARY
        </p>
        <h1 className="mt-2 font-serif text-[clamp(32px,5.2vw,50px)] font-normal tracking-[-0.01em] text-zinc-900 leading-[1.05] dark:text-zinc-50">
          Everything you&apos;re tracking<span className="text-[#3b5bf5] dark:text-[#6b7bf5]">.</span>
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500 dark:text-zinc-400">
          {formatCountSubtitle(tabCounts.all, uniqueFormatsCount)}
        </p>
      </header>

      {/* Media Type Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 sm:gap-8 overflow-x-auto [scrollbar-width:none]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "-mb-px flex items-center gap-1.5 pb-3 pt-1 text-[11px] font-mono tracking-[0.14em] uppercase transition-colors whitespace-nowrap",
                isActive
                  ? "border-b-2 border-[#3b5bf5] text-zinc-900 font-semibold dark:border-[#6b7bf5] dark:text-zinc-100"
                  : "border-b-2 border-transparent text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300",
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(isActive ? "text-[#3b5bf5] dark:text-[#6b7bf5]" : "text-zinc-400 dark:text-zinc-600")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Sort Row */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_PILLS.map((pill) => {
            const isActive = activeStatus === pill.id;

            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => handleStatusChange(pill.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.1em] uppercase transition-colors",
                  isActive
                    ? "bg-zinc-900 text-white font-semibold shadow-xs dark:bg-white dark:text-zinc-950"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200",
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((v) => !v)}
            aria-expanded={isSortOpen}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 transition-colors"
          >
            <span>{activeSortLabel}</span>
            <ChevronDown className="size-3.5 text-zinc-400" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setActiveSort(opt.id);
                    setIsSortOpen(false);
                  }}
                  className={cn(
                    "flex w-full px-3.5 py-2 text-left text-xs transition-colors",
                    activeSort === opt.id
                      ? "bg-sky-50 text-sky-700 font-medium dark:bg-sky-500/10 dark:text-sky-400"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white",
                  )}
                >
                  {opt.menuLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950/40">
        {/* Table Column Headers */}
        <div
          className={cn(
            "border-b border-zinc-200 bg-[#fafaf8] py-3 font-mono text-[10px] tracking-[0.16em] uppercase text-zinc-400 dark:border-zinc-800/80 dark:bg-transparent dark:text-zinc-500",
            LIBRARY_GRID_LAYOUT,
          )}
        >
          <div>TITLE</div>
          <div className="hidden lg:block">STATUS</div>
          <div className="hidden lg:block">PROGRESS</div>
          <div className="text-center">RATING</div>
          <div />
        </div>

        {/* Table Rows */}
        {loading ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-zinc-500 dark:text-zinc-400">
            {activeTab !== "all" || activeStatus !== "all" ? (
              <>
                <p className="text-sm">No titles match the selected filters.</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 font-mono text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  Reset filters
                </button>
              </>
            ) : (
              <>
                <p className="font-serif text-lg text-zinc-800 dark:text-zinc-200">
                  Your library is empty.
                </p>
                <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                  Search for films, series, games, anime, or manga to start tracking your progress.
                </p>
                <Link
                  href="/home/search"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Search className="size-3.5" />
                  <span>Search titles</span>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {sortedItems.map((item) => {
              const isCompleted =
                item.status === "completed" || item.status === "done" || item.status === "watched";

              return (
                <MediaLibraryRow
                  key={item.mediaId}
                  title={item.title}
                  year={item.year}
                  studio={item.studio}
                  image={item.image}
                  type={item.type}
                  status={item.status}
                  rating={item.rating ?? undefined}
                  isFavorite={item.isFavorite}
                  progress={
                    item.type === "movie"
                      ? { current: 1, total: 1, unit: "film", isCompleted }
                      : item.type === "game" && !item.total
                        ? { current: item.current, unit: "h", isCompleted }
                        : { current: item.current, total: item.total, unit: item.unit, isCompleted }
                  }
                  onClick={() => setSelectedItem(item)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <span>
            Page {page} of {totalPages} ({totalItems} titles)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => handlePageChange(page - 1)}
              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40 transition-colors dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => handlePageChange(page + 1)}
              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40 transition-colors dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit / Details Sheet */}
      <LibraryEntrySheet
        item={selectedItem}
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}
