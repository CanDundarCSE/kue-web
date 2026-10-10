"use client";

import { Globe, Lock, NotebookPen, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { Skeleton } from "@/app/components/ui/skeleton";
import type { PickerMedia } from "@/app/features/reviews/library-media-picker";
import ReviewComposer, {
  normalizeRating,
  RATING_MAX,
} from "@/app/features/reviews/review-composer";
import { buildPageItems } from "@/app/features/search/search-paginator";
import { initialOf } from "@/lib/current-user";
import {
  createReview,
  deleteReview,
  fetchMyReviews,
  updateReview,
  type ReviewDto,
  type ReviewPage,
} from "@/lib/api/reviews";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const MEDIA_TYPES = new Set<MediaType>(["movie", "series", "game", "anime", "manga"]);
const RATING_STEPS = Array.from({ length: RATING_MAX }, (_, index) => index + 1);

type Filter = "all" | "public" | "private";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

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

/** "OCT 9" - short, uppercase, matching the meta line in the design. */
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .replace(/^([a-z])/, (c) => c.toUpperCase());
}

/** "2 H AGO" / "3 D AGO" - relative time for the edited marker. */
function formatRelative(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d ago`;
  return formatDate(value);
}

/** Read-only 1-10 display; mirrors the composer's segmented control. */
function RatingScale({ value }: { value: number | null }) {
  const rating = normalizeRating(value);

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={rating === null ? "Not rated" : `${rating} out of 10`}
    >
      <span aria-hidden="true" className="flex items-center gap-1">
        {RATING_STEPS.map((step) => (
          <span
            key={step}
            className={cn(
              "h-3.5 w-1.5 rounded-full",
              rating !== null && step <= rating ? "bg-accent" : "bg-line-2/60",
            )}
          />
        ))}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-ink-3">
        {rating === null ? "—" : `${rating}/10`}
      </span>
      <span className="sr-only">
        {rating === null ? "Not rated" : `Rated ${rating} out of 10`}
      </span>
    </span>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] uppercase",
        isPublic ? "text-ink-2" : "text-ink-3",
      )}
    >
      {isPublic ? (
        <>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          <Globe className="size-3" strokeWidth={2} aria-hidden="true" />
        </>
      ) : (
        <>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-ink-3" />
          <Lock className="size-3" strokeWidth={2} aria-hidden="true" />
        </>
      )}
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

function VisibilitySwitch({
  isPublic,
  busy,
  onToggle,
}: {
  isPublic: boolean;
  busy: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-line-2/70 p-0.5"
      role="group"
      aria-label="Review visibility"
    >
      <button
        type="button"
        aria-pressed={isPublic}
        disabled={busy}
        onClick={() => onToggle(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase",
          "transition-colors duration-150 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          "disabled:pointer-events-none disabled:opacity-50",
          isPublic ? "bg-foreground text-background" : "text-ink-3 hover:text-foreground",
        )}
      >
        Public
      </button>
      <button
        type="button"
        aria-pressed={!isPublic}
        disabled={busy}
        onClick={() => onToggle(false)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase",
          "transition-colors duration-150 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          "disabled:pointer-events-none disabled:opacity-50",
          !isPublic ? "bg-foreground text-background" : "text-ink-3 hover:text-foreground",
        )}
      >
        Private
      </button>
    </div>
  );
}

const ghostButton =
  "inline-flex items-center gap-1.5 rounded-md border border-line-2/70 px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase " +
  "transition-colors duration-150 motion-reduce:transition-none hover:bg-surface-3 hover:text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 " +
  "disabled:pointer-events-none disabled:opacity-40";

function ReviewCard({
  review,
  editing,
  busyReviewId,
  editError,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onToggleVisibility,
}: {
  review: ReviewDto;
  editing: boolean;
  busyReviewId: number | null;
  /** Only surfaced on the row currently being edited. */
  editError?: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (input: {
    content: string;
    rating: number | null;
    isPublic: boolean;
  }) => void;
  onDelete: () => void;
  onToggleVisibility: (next: boolean) => void;
}) {
  const busy = busyReviewId === review.id;
  const type = asMediaType(review.mediaType);

  return (
    <article className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      {editing ? (
        <ReviewComposer
          key={`edit-${review.id}`}
          mode="edit"
          initialContent={review.content}
          initialRating={review.rating ?? null}
          initialIsPublic={review.isPublic}
          reviewedMediaIds={new Set()}
          busy={busy}
          error={editError ?? null}
          onCancel={onCancelEdit}
          onSubmit={(input) => {
            if (!input.content.trim()) return;
            onSubmitEdit({
              content: input.content,
              rating: input.rating,
              isPublic: input.isPublic,
            });
          }}
        />
      ) : (
        <>
          <header className="flex items-start justify-between gap-4">
            <Link
              href={`/media/${review.mediaId}`}
              className="flex min-w-0 items-center gap-3.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <MediaAvatarCard
                title={review.mediaTitle}
                year={review.mediaYear ?? undefined}
                image={review.mediaCoverImage || undefined}
                type={type}
                size="md"
              />
              <span className="min-w-0">
                <span className="block truncate font-serif text-[17px] leading-tight text-foreground">
                  {review.mediaTitle}
                </span>
                <span className="mt-1.5 block font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">
                  {mediaTypeLabel(review.mediaType)}
                  {review.mediaYear ? ` · ${review.mediaYear}` : ""}
                </span>
              </span>
            </Link>

            <RatingScale value={review.rating ?? null} />
          </header>

          <p className="mt-4 font-serif text-[15px] leading-relaxed text-foreground">
            {review.content}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">
            <span>Written {formatDate(review.createdAt)}</span>
            {review.updatedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>Edited {formatRelative(review.updatedAt)}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <VisibilityBadge isPublic={review.isPublic} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={onStartEdit} className={ghostButton}>
                <Pencil className="size-3" strokeWidth={2} aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className={ghostButton}
              >
                <Trash2 className="size-3" strokeWidth={2} aria-hidden="true" />
                Delete
              </button>
            </div>

            <VisibilitySwitch
              isPublic={review.isPublic}
              busy={busy}
              onToggle={onToggleVisibility}
            />
          </div>
        </>
      )}
    </article>
  );
}

function ReviewCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-[54px] w-[42px] shrink-0 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="mt-2 h-2.5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3.5 w-full rounded-full" />
      <Skeleton className="mt-2 h-3.5 w-4/5 rounded-full" />
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>
    </div>
  );
}

function EmptyState({
  filter,
  onWrite,
}: {
  filter: Filter;
  onWrite: () => void;
}) {
  const filtered = filter !== "all";

  return (
    <div className="flex flex-col items-center rounded-xl border border-line bg-surface-2 px-6 py-14 text-center">
      <span className="grid size-9 place-items-center rounded-full bg-surface-3 text-ink-3">
        <NotebookPen className="size-4" strokeWidth={1.75} />
      </span>
      <span className="mt-3 font-mono text-[9px] tracking-[0.16em] text-ink-3 uppercase">
        {filtered ? `No ${filter} reviews` : "No reviews yet"}
      </span>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
        {filtered
          ? "Switch back to all to see the rest of your reviews."
          : "Pick a title from your library and write up to 255 characters on what you thought."}
      </p>
      {!filtered && (
        <button
          type="button"
          onClick={onWrite}
          className={cn(
            "mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 font-mono text-[10px] tracking-[0.12em] text-background uppercase",
            "transition-opacity duration-150 motion-reduce:transition-none hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          <NotebookPen className="size-3.5" strokeWidth={2} />
          Write a review
        </button>
      )}
    </div>
  );
}

export default function ReviewsView() {
  const { user, loading: userLoading } = useCurrentUser();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<ReviewPage | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [composing, setComposing] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [busyReviewId, setBusyReviewId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const headingRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchMyReviews({
        page,
        pageSize: PAGE_SIZE,
        isPublic: filter === "all" ? null : filter === "public",
      });

      if (result === null) {
        setError(true);
        return;
      }

      setData(result);
      setError(false);

      // A filter or page change can leave the viewer past the last page.
      if (result.items.length === 0 && result.totalItems > 0) {
        setPage(result.totalPages);
      }
    } catch {
      setError(true);
    }
  }, [page, filter]);

  useEffect(() => {
    if (userLoading || user === null) return;

    let cancelled = false;
    void (async () => {
      await load();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [user, userLoading, load, reloadKey]);

  // Totals come from unfiltered, first-page requests so the header stats stay
  // correct no matter which filter or page is active.
  const [totals, setTotals] = useState<{ all: number; public: number } | null>(null);

  useEffect(() => {
    if (userLoading || user === null) return;

    let cancelled = false;

    void (async () => {
      const [all, publicOnly] = await Promise.all([
        fetchMyReviews({ page: 1, pageSize: 1, isPublic: null }),
        fetchMyReviews({ page: 1, pageSize: 1, isPublic: true }),
      ]);

      if (cancelled) return;
      if (all === null || publicOnly === null) return;
      setTotals({ all: all.totalItems, public: publicOnly.totalItems });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, userLoading, reloadKey]);

  const reviews = useMemo(() => data?.items ?? [], [data]);
  const reviewedMediaIds = useMemo(
    () => new Set(reviews.map((review) => review.mediaId)),
    [reviews],
  );

  const totalReviews = totals?.all ?? 0;

  const applyFilter = (value: Filter) => {
    if (value === filter) return;
    setFilter(value);
    setPage(1);
    setEditingId(null);
  };

  const handleCreate = async (input: {
    media: PickerMedia | null;
    content: string;
    rating: number | null;
    isPublic: boolean;
  }) => {
    if (!input.media || busy) return;

    setBusy(true);
    setCreateError(null);

    const { review, error: message } = await createReview(input.media.mediaId, {
      content: input.content,
      rating: input.rating,
      containsSpoilers: false,
      isPublic: input.isPublic,
    });

    setBusy(false);

    if (review === null) {
      setCreateError(message ?? "Couldn&rsquo;t save the review.");
      return;
    }

    setComposing(false);
    setFilter("all");
    setPage(1);
    setReloadKey((key) => key + 1);
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleUpdate = async (
    reviewId: number,
    input: { content: string; rating: number | null; isPublic: boolean },
  ) => {
    setBusyReviewId(reviewId);
    setEditError(null);

    const { review, error: message } = await updateReview(reviewId, {
      content: input.content,
      rating: input.rating,
      containsSpoilers: false,
      isPublic: input.isPublic,
    });

    setBusyReviewId(null);

    if (review === null) {
      setEditError(message ?? "Couldn&rsquo;t update the review.");
      return;
    }

    setEditingId(null);
    // Patch in place so the card doesn't jump or lose scroll position.
    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((item) => (item.id === reviewId ? review : item)) }
        : prev,
    );
  };

  const handleToggleVisibility = async (review: ReviewDto, next: boolean) => {
    if (review.isPublic === next) return;

    setBusyReviewId(review.id);
    const previous = review;

    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === review.id ? { ...item, isPublic: next } : item,
            ),
          }
        : prev,
    );

    const { review: updated, error: message } = await updateReview(review.id, {
      content: previous.content,
      rating: previous.rating ?? null,
      containsSpoilers: previous.containsSpoilers,
      isPublic: next,
    });

    setBusyReviewId(null);

    if (updated === null) {
      // Roll the optimistic patch back.
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) => (item.id === review.id ? previous : item)),
            }
          : prev,
      );
      setRowError(message ?? "Couldn&rsquo;t change visibility.");
      return;
    }

    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((item) => (item.id === review.id ? updated : item)) }
        : prev,
    );
  };

  const handleDelete = async (review: ReviewDto) => {
    if (
      !window.confirm(
        `Delete your review of "${review.mediaTitle}"? This can't be undone.`,
      )
    ) {
      return;
    }

    setBusyReviewId(review.id);
    setRowError(null);

    const message = await deleteReview(review.id);
    setBusyReviewId(null);

    if (message !== null) {
      setRowError(message);
      return;
    }

    setEditingId(null);
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((item) => item.id !== review.id),
            totalItems: Math.max(0, prev.totalItems - 1),
          }
        : prev,
    );
  };

  if (userLoading || user === null) {
    return <ReviewsSkeleton />;
  }

  const pageItems = buildPageItems(page, data?.totalPages ?? 1);

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex items-center gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-3 font-serif text-[20px] text-foreground sm:size-14">
          {initialOf(user.username)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-[clamp(22px,3vw,28px)] leading-tight text-foreground">
            {user.username}
          </h1>
          <p className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">
            {totals?.all ?? 0} {(totals?.all ?? 0) === 1 ? "review" : "reviews"} ·{" "}
            {totals?.public ?? 0} public
          </p>
        </div>
      </header>

      <div ref={headingRef} className="mt-9 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
            Your reviews
          </h2>
          {data !== null && (
            <span aria-hidden="true" className="h-px w-24 bg-line sm:w-40" />
          )}
          {data !== null && (
            <span className="font-mono text-[11px] tabular-nums text-ink-3">
              {totalReviews}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-xl border border-line-2/70 p-0.5"
            role="group"
            aria-label="Filter reviews by visibility"
          >
            {FILTERS.map((option) => {
              const active = option.value === filter;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyFilter(option.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase",
                    "transition-colors duration-150 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    active ? "bg-foreground text-background" : "text-ink-3 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {!composing && (
            <button
              type="button"
              onClick={() => {
                setComposing(true);
                setCreateError(null);
                setFilter("all");
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 font-mono text-[10px] tracking-[0.12em] text-background uppercase",
                "transition-opacity duration-150 motion-reduce:transition-none hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              )}
            >
              <NotebookPen className="size-3.5" strokeWidth={2} />
              Write a review
            </button>
          )}
        </div>
      </div>

      {composing && (
        <div className="mt-5">
          <ReviewComposer
            key="create"
            mode="create"
            initialContent=""
            initialRating={null}
            initialIsPublic
            reviewedMediaIds={reviewedMediaIds}
            busy={busy}
            error={createError}
            onCancel={() => {
              setComposing(false);
              setCreateError(null);
            }}
            onSubmit={(input) => void handleCreate(input)}
          />
        </div>
      )}

      {rowError && (
        <p className="mt-4 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{rowError}</p>
      )}

      <div className="mt-5 space-y-4">
        {data === null && !error && (
          <>
            <ReviewCardSkeleton />
            <ReviewCardSkeleton />
          </>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface-2 px-6 py-12 text-center">
            <p className="text-[13px] text-ink-2">Couldn&rsquo;t load your reviews.</p>
            <button type="button" onClick={() => void load()} className={ghostButton}>
              Try again
            </button>
          </div>
        )}

        {data !== null && !error && reviews.length === 0 && (
          <EmptyState
            filter={filter}
            onWrite={() => setComposing(true)}
          />
        )}

        {data !== null &&
          !error &&
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              editing={editingId === review.id}
              busyReviewId={busyReviewId}
              editError={editError}
              onStartEdit={() => {
                setEditingId(review.id);
                setRowError(null);
                setEditError(null);
              }}
              onCancelEdit={() => {
                setEditingId(null);
                setEditError(null);
              }}
              onSubmitEdit={(input) => void handleUpdate(review.id, input)}
              onDelete={() => void handleDelete(review)}
              onToggleVisibility={(next) => void handleToggleVisibility(review, next)}
            />
          ))}
      </div>

      {data !== null && !error && (data.totalPages ?? 1) > 1 && (
        <nav aria-label="Reviews pages" className="mt-8">
          <ul className="flex flex-wrap items-center justify-center gap-1.5">
            <li>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={ghostButton}
              >
                Previous
              </button>
            </li>

            {pageItems.map((item) =>
              typeof item === "number" ? (
                <li key={item}>
                  <button
                    type="button"
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => setPage(item)}
                    className={cn(
                      "grid h-9 min-w-9 place-items-center rounded-md border px-2.5 font-mono text-[12px]",
                      "transition-colors duration-150 motion-reduce:transition-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                      item === page
                        ? "border-transparent bg-foreground text-background"
                        : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                </li>
              ) : (
                <li
                  key={item}
                  aria-hidden="true"
                  className="grid h-9 min-w-6 place-items-center font-mono text-[12px] text-ink-3"
                >
                  &hellip;
                </li>
              ),
            )}

            <li>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className={ghostButton}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export function ReviewsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <div aria-hidden="true" className="flex items-center gap-3.5">
        <Skeleton className="size-12 shrink-0 rounded-full sm:size-14" />
        <div>
          <Skeleton className="h-7 w-44 rounded-md" />
          <Skeleton className="mt-2.5 h-2.5 w-52 rounded-full" />
        </div>
      </div>
      <div aria-hidden="true" className="mt-9 flex items-center gap-3">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-px w-40 rounded-full" />
      </div>
      <div className="mt-5 space-y-4">
        <ReviewCardSkeleton />
        <ReviewCardSkeleton />
      </div>
    </div>
  );
}