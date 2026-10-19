"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import SpoilerText from "@/app/components/spoiler-text";
import SectionLabel from "@/app/features/home/section-label";
import ReviewReportLink from "@/app/features/reviews/review-report-link";
import SearchPaginator from "@/app/features/search/search-paginator";
import { fetchMediaDetails, type MediaDto } from "@/lib/api/media";
import {
  fetchMediaReviews,
  type MediaReviewSort,
  type ReviewDto,
} from "@/lib/api/reviews";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const SORTS: { value: MediaReviewSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .replace(/^([a-z])/, (c) => c.toUpperCase());
}

function ReviewRow({ review }: { review: ReviewDto }) {
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <p className="truncate text-[14px] font-semibold text-foreground">
          {review.username}
        </p>
        <p className="shrink-0 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
          {typeof review.rating === "number" ? `${review.rating}/10 · ` : ""}
          {formatDate(review.createdAt)}
        </p>
      </div>
      <div className="mt-1.5 font-sans text-[14px] leading-relaxed text-ink-2">
        <SpoilerText
          content={review.content}
          spoilers={review.spoilers ?? []}
          maskAll={review.containsSpoilers && (review.spoilers?.length ?? 0) === 0}
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        {review.containsSpoilers && (
          <p className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-accent uppercase">
            Contains spoilers
          </p>
        )}
        <ReviewReportLink
          reviewId={review.id}
          mediaId={review.mediaId}
          className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase underline-offset-2 transition-colors hover:text-foreground hover:underline"
        />
      </div>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li aria-hidden="true" className="px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-3.5 w-28 animate-pulse rounded-full bg-surface-3" />
        <div className="h-2.5 w-20 animate-pulse rounded-full bg-surface-3" />
      </div>
      <div className="mt-2.5 h-3 w-full animate-pulse rounded-full bg-surface-3" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-surface-3" />
    </li>
  );
}

export default function MediaReviewsView({
  mediaId,
  sort,
  hideSpoilers,
  page,
}: {
  mediaId: number;
  sort: string;
  hideSpoilers: boolean;
  page: number;
}) {
  const router = useRouter();

  const [media, setMedia] = useState<MediaDto | null>(null);
  const [items, setItems] = useState<ReviewDto[]>([]);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [lastPage, setLastPage] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const requestRef = useRef(0);

  const validId = Number.isInteger(mediaId) && mediaId > 0;

  const pushState = useCallback(
    (next: { sort?: string; hideSpoilers?: boolean; page?: number }, replace = false) => {
      const params = new URLSearchParams();
      const nextSort = next.sort ?? sort;
      if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
      const nextHidden = next.hideSpoilers ?? hideSpoilers;
      if (nextHidden) params.set("spoilers", "hidden");
      const nextPage = next.page ?? 1;
      if (nextPage > 1) params.set("page", String(nextPage));

      const href = `/media/${mediaId}/reviews${params.size ? `?${params.toString()}` : ""}`;
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    [router, mediaId, sort, hideSpoilers],
  );

  const reload = useCallback(async () => {
    if (!validId) {
      requestRef.current++;
      setState("idle");
      return;
    }

    const requestId = ++requestRef.current;
    setState("loading");

    const [details, result] = await Promise.all([
      fetchMediaDetails(mediaId),
      fetchMediaReviews(mediaId, {
        page,
        pageSize: PAGE_SIZE,
        sort: (sort as MediaReviewSort) ?? "newest",
        hideSpoilers,
      }),
    ]);
    if (requestId !== requestRef.current) return;

    if (!result) {
      setState("error");
      return;
    }

    if (page > result.totalPages && result.totalPages >= 1) {
      requestRef.current++;
      setState("idle");
      pushState({ page: result.totalPages }, true);
      return;
    }

    setMedia(details);
    setItems(result.items);
    setTotalItems(result.totalItems);
    setCurrentPage(page);
    setLastPage(result.totalPages);
    setState("ready");
    window.scrollTo(0, 0);
  }, [validId, mediaId, sort, hideSpoilers, page, pushState]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(handle);
  }, [reload]);

  const goToPage = (next: number) => {
    if (state !== "ready" || next === currentPage) return;
    if (next < 1 || next > lastPage) return;
    pushState({ page: next });
  };

  const applySort = (value: string) => {
    if (value === sort) return;
    pushState({ sort: value, page: 1 });
  };

  const applySpoilerFilter = (hidden: boolean) => {
    if (hidden === hideSpoilers) return;
    pushState({ hideSpoilers: hidden, page: 1 });
  };

  if (!validId) {
    return (
      <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center px-5 py-24 text-center sm:px-8">
        <h1 className="font-serif text-[28px] text-foreground">Title not found.</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          We couldn&rsquo;t find this title in the catalog.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 font-mono text-xs tracking-wider text-foreground uppercase transition-colors hover:bg-surface-3"
        >
          <ArrowLeft className="size-3.5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
      <section aria-labelledby="reviews-heading">
        <SectionLabel>Reviews</SectionLabel>

        <h1
          id="reviews-heading"
          className="mt-5 font-serif text-[clamp(28px,4vw,40px)] leading-[1.08] tracking-[-0.01em] text-foreground"
        >
          {media ? (
            <>
              What readers think of{" "}
              <Link
                href={`/media/${mediaId}`}
                className="text-accent transition-colors hover:underline"
              >
                {media.title}
              </Link>
            </>
          ) : (
            <>Reviews<span className="text-accent">.</span></>
          )}
        </h1>

        {totalItems !== null && (
          <p className="mt-3 text-[14px] text-ink-2">
            {totalItems} {totalItems === 1 ? "review" : "reviews"}
            {hideSpoilers ? " · spoilers hidden" : ""}.
          </p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-1.5" role="group" aria-label="Sort reviews">
        {SORTS.map((option) => {
          const active = option.value === sort;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => applySort(option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase",
                "transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                active
                  ? "border-transparent bg-foreground text-background"
                  : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}

        <span aria-hidden="true" className="mx-1 h-4 w-px bg-line-2/70" />

        <div className="flex items-center gap-1.5" role="group" aria-label="Spoiler filter">
          {[
            { value: false, label: "All reviews" },
            { value: true, label: "Hide spoilers" },
          ].map((option) => {
            const active = option.value === hideSpoilers;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={active}
                onClick={() => applySpoilerFilter(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase",
                  "transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  active
                    ? "border-transparent bg-foreground text-background"
                    : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {state === "loading" && (
          <ul aria-hidden="true" className="divide-y divide-line rounded-xl border border-line bg-surface-2/60">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </ul>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface-2 px-6 py-12 text-center">
            <p className="text-[13px] text-ink-2">Couldn&rsquo;t load reviews.</p>
            <button
              type="button"
              onClick={() => void reload()}
              className={cn(
                "rounded-md border border-line-2/70 px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
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
              No reviews{hideSpoilers ? " without spoilers" : ""} yet.
            </h3>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
              {hideSpoilers
                ? "Every review so far contains spoilers — or be the first to write a spoiler-free one."
                : "Be the first to write one from your reviews page."}
            </p>
            <Link
              href="/reviews"
              className={cn(
                "mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line-2/70 px-3.5 py-1.5 text-xs font-semibold text-ink-2",
                "transition-colors hover:bg-surface-3 hover:text-foreground",
              )}
            >
              Write a review
            </Link>
          </div>
        )}

        {state === "ready" && items.length > 0 && (
          <>
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface-2/60">
              {items.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
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
