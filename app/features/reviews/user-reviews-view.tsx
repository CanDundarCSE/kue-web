"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ReviewRow from "@/app/features/reviews/review-row";
import SearchPaginator from "@/app/features/search/search-paginator";
import SectionLabel from "@/app/features/home/section-label";
import { fetchUserReviews, type ReviewDto } from "@/lib/api/reviews";

const PAGE_SIZE = 10;

/** Every public review written by one user, paginated. */
export default function UserReviewsView({ username }: { username: string }) {
  const [reviews, setReviews] = useState<ReviewDto[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const handle = setTimeout(() => {
      setReviews(null);
      setError(false);
      void fetchUserReviews(username, { page, pageSize: PAGE_SIZE }).then((data) => {
        if (cancelled) return;
        if (!data) {
          setError(true);
          setReviews([]);
          return;
        }
        setReviews(data.items);
        setTotalPages(Math.max(1, data.totalPages));
        setTotalItems(data.totalItems);
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [username, page]);

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/profile/${encodeURIComponent(username)}`}
        className="font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase transition-colors hover:text-foreground"
      >
        ← {username}
      </Link>

      <header className="mt-5">
        <SectionLabel>Reviews</SectionLabel>
        <h1 className="mt-3 font-serif text-[clamp(26px,4vw,38px)] leading-tight text-foreground">
          What {username} thinks<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 text-[13px] text-ink-2">
          {totalItems} {totalItems === 1 ? "review" : "reviews"} published.
        </p>
      </header>

      <div className="mt-6 rounded-xl border border-line bg-surface-2/40 px-4 sm:px-5">
        {reviews === null ? (
          <div className="flex flex-col gap-4 py-4" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex gap-3.5">
                <div className="h-[62px] w-[46px] shrink-0 animate-pulse rounded-lg bg-surface-3" />
                <div className="min-w-0 flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-surface-3" />
                  <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-surface-3" />
                  <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-surface-3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-[13px] text-ink-2">
            Couldn&apos;t load these reviews. The profile may be private.
          </p>
        ) : reviews.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-3">No reviews yet.</p>
        ) : (
          <ul>
            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} clamp={false} />
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
            Page {page} of {totalPages}
          </span>
          <SearchPaginator
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(next) => {
              setPage(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={reviews === null}
          />
        </div>
      ) : null}
    </div>
  );
}
