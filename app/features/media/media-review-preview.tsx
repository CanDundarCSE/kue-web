"use client";

import { ArrowRight, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import SpoilerText from "@/app/components/spoiler-text";
import RatingBadge from "@/app/components/rating-badge";
import SectionLabel from "@/app/features/home/section-label";
import {
  fetchMediaReviews,
  type ReviewDto,
} from "@/lib/api/reviews";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT = 3;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .replace(/^([a-z])/, (c) => c.toUpperCase());
}

function PreviewRow({ review }: { review: ReviewDto }) {
  return (
    <li className="px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {review.username}
          </p>
          {typeof review.rating === "number" && (
            <RatingBadge rating={review.rating} />
          )}
        </div>
        <p className="shrink-0 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
          {formatDate(review.createdAt)}
        </p>
      </div>
      <div className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-2">
        <SpoilerText
          content={review.content}
          spoilers={review.spoilers ?? []}
          maskAll={review.containsSpoilers && (review.spoilers?.length ?? 0) === 0}
        />
      </div>
    </li>
  );
}

// Latest public reviews for a media title, shown on the detail page with a
// link to the full review feed. Self-contained: fetches its own page.
export default function MediaReviewPreview({ mediaId }: { mediaId: number }) {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(mediaId) || mediaId <= 0) return;

    let cancelled = false;
    const handle = setTimeout(() => {
      void (async () => {
        const page = await fetchMediaReviews(mediaId, {
          page: 1,
          pageSize: PREVIEW_COUNT,
          sort: "newest",
        });
        if (cancelled) return;
        setReviews(page?.items ?? []);
        setTotal(page?.totalItems ?? 0);
        setLoaded(true);
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [mediaId]);

  if (!loaded) return null;

  return (
    <section
      aria-label="Reviews"
      className="mt-6 rounded-2xl border border-line bg-surface-2 shadow-xs"
    >
      <div className="flex items-center gap-3 px-4 pt-5 sm:px-5">
        <SectionLabel>
          Reviews{total > 0 ? ` · ${total}` : ""}
        </SectionLabel>
        <div className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <MessageSquareText className="size-5 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
          <p className="mt-3 text-[13px] text-ink-2">No reviews yet.</p>
          <Link
            href="/reviews"
            className={cn(
              "mt-3 rounded-md border border-line-2/70 px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            Write the first review
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-2 divide-y divide-line">
            {reviews.map((review) => (
              <PreviewRow key={review.id} review={review} />
            ))}
          </ul>
          <Link
            href={`/media/${mediaId}/reviews`}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-b-2xl border-t border-line px-3 py-2.5",
              "font-mono text-[9px] tracking-[0.16em] text-ink-3 uppercase",
              "transition-colors hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            {total > PREVIEW_COUNT ? `See all ${total} reviews` : "See all reviews"}
            <ArrowRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}
