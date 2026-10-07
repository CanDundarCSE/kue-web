"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import MediaLibraryRow, { LIBRARY_GRID_LAYOUT } from "@/app/components/media-library-row";
import { type MediaType } from "@/app/components/media-avatar-card";
import LibraryEntrySheet, { type EditableLibraryItem } from "@/app/features/library/library-entry-sheet";
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

// Fallback demo items matching Image 1
const DEMO_ITEMS: EditableLibraryItem[] = [
  {
    mediaId: 101,
    title: "Frieren: Beyond Journey's End",
    year: 2023,
    studio: "MADHOUSE",
    type: "anime",
    status: "watching",
    current: 18,
    total: 28,
    unit: "ep",
    rating: 9.6,
  },
  {
    mediaId: 102,
    title: "Elden Ring",
    year: 2022,
    studio: "FROMSOFTWARE",
    type: "game",
    status: "playing",
    current: 84,
    total: 150,
    unit: "h",
    rating: 8.4,
  },
  {
    mediaId: 103,
    title: "Berserk",
    year: 1989,
    studio: "KENTARO MIURA",
    type: "manga",
    status: "reading",
    current: 246,
    total: 374,
    unit: "ch",
    rating: 9.8,
  },
  {
    mediaId: 104,
    title: "Severance",
    year: 2022,
    studio: "DAN ERICKSON",
    type: "series",
    status: "watching",
    current: 9,
    total: 19,
    unit: "ep",
    rating: 8.2,
  },
  {
    mediaId: 105,
    title: "Parasite",
    year: 2019,
    studio: "BONG JOON-HO",
    type: "movie",
    status: "watched",
    current: 1,
    total: 1,
    unit: "film",
    rating: 9.4,
  },
  {
    mediaId: 106,
    title: "Vagabond",
    year: 1998,
    studio: "TAKEHIKO INOUE",
    type: "manga",
    status: "hold",
    current: 140,
    total: 327,
    unit: "ch",
    rating: 9.7,
  },
  {
    mediaId: 107,
    title: "Alan Wake Remastered",
    year: 2021,
    studio: "XBOX SERIES X|S",
    type: "game",
    status: "completed",
    current: 1,
    unit: "game",
    rating: 10.0,
  },
];

function formatCountSubtitle(totalCount: number, formatCount: number) {
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
    rating: dto.rating ?? dto.media?.score ?? null,
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

export default function LibraryView() {
  const { user, loading: authLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [activeSort, setActiveSort] = useState<SortOption>("recently_touched");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<EditableLibraryItem[]>(DEMO_ITEMS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(DEMO_ITEMS.length);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [selectedItem, setSelectedItem] = useState<EditableLibraryItem | null>(null);

  // Tab counts from overview stats or current items
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
      // Fallback
    }
  }, [user]);

  // Fetch tab counts from overview stats
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

  // Fetch library items with pageSize = 20
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    (async () => {
      try {
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

        if (Array.isArray(data.items) && (data.items.length > 0 || data.totalItems > 0)) {
          setItems(data.items.map(mapDtoToEditable));
          setTotalItems(data.totalItems);
          setTotalPages(Math.max(1, data.totalPages));
          setIsDemo(false);
        } else if (activeTab === "all" && activeStatus === "all") {
          setItems(DEMO_ITEMS);
          setTotalItems(DEMO_ITEMS.length);
          setTotalPages(1);
          setIsDemo(true);
        } else {
          setItems([]);
          setTotalItems(0);
          setTotalPages(1);
          setIsDemo(false);
        }
      } catch {
        if (cancelled) return;
        setItems(DEMO_ITEMS);
        setTotalItems(DEMO_ITEMS.length);
        setTotalPages(1);
        setIsDemo(true);
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

  // Derive counts if demo
  const displayedCounts = useMemo(() => {
    if (!isDemo && tabCounts.all > 0) {
      return tabCounts;
    }
    const map: Record<TabType, number> = {
      all: DEMO_ITEMS.length,
      movie: 0,
      series: 0,
      game: 0,
      anime: 0,
      manga: 0,
    };
    for (const item of DEMO_ITEMS) {
      if (item.type in map) {
        map[item.type]++;
      }
    }
    return map;
  }, [isDemo, tabCounts]);

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

  // Save handler
  const handleSaveItem = async (updated: EditableLibraryItem) => {
    setItems((prev) =>
      prev.map((i) => (i.mediaId === updated.mediaId ? updated : i)),
    );

    if (isDemo) return;

    try {
      await authFetch(`/api/library/${updated.mediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updated.status,
          progress: updated.current,
          rating: updated.rating,
        }),
      });
      void refreshStats();
    } catch {
      // Ignore background sync errors
    }
  };

  // Delete handler
  const handleDeleteItem = async (mediaId: number) => {
    setItems((prev) => prev.filter((i) => i.mediaId !== mediaId));
    setTotalItems((prev) => Math.max(0, prev - 1));

    if (isDemo) return;

    try {
      await authFetch(`/api/library/${mediaId}`, {
        method: "DELETE",
      });
      void refreshStats();
    } catch {
      // Ignore
    }
  };

  const activeSortLabel = SORT_OPTIONS.find((o) => o.id === activeSort)?.label ?? "RECENTLY TOUCHED";
  const uniqueFormatsCount = useMemo(() => {
    const counts = [displayedCounts.movie, displayedCounts.series, displayedCounts.game, displayedCounts.anime, displayedCounts.manga];
    return Math.max(1, counts.filter((c) => c > 0).length);
  }, [displayedCounts]);

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      {/* Top Banner if demo mode */}
      {isDemo && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          <span>
            Displaying sample titles matching the design reference. {!user && "Sign in to track your personal collection."}
          </span>
          {!user && (
            <Link
              href="/login"
              className="font-mono text-xs text-sky-600 hover:text-sky-700 font-semibold dark:text-sky-400 dark:hover:text-sky-300"
            >
              Sign in &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Header Section */}
      <header className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500">
          LIBRARY
        </p>
        <h1 className="mt-2 font-serif text-[clamp(32px,5.2vw,50px)] font-normal tracking-[-0.01em] text-zinc-900 leading-[1.05] dark:text-zinc-50">
          Everything you&apos;re tracking<span className="text-[#3b5bf5] dark:text-[#6b7bf5]">.</span>
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500 dark:text-zinc-400">
          {formatCountSubtitle(displayedCounts.all, uniqueFormatsCount)}
        </p>
      </header>

      {/* Media Type Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 sm:gap-8 overflow-x-auto [scrollbar-width:none]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = displayedCounts[tab.id];

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
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
            <p className="text-sm">No titles match the selected filters.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 font-mono text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              Reset filters
            </button>
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
