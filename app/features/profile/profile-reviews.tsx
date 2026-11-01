"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ReviewRow from "@/app/features/reviews/review-row";
import SectionLabel from "@/app/features/home/section-label";
import { fetchUserReviews, type ReviewDto } from "@/lib/api/reviews";

/** Latest reviews on a public profile, with a link to the full list. */
export default function ProfileReviews({ username }: { username: string }) {
  const [reviews, setReviews] = useState<ReviewDto[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      void fetchUserReviews(username, { page: 1, pageSize: 3 }).then((data) => {
        if (cancelled) return;
        setReviews(data?.items ?? []);
        setTotal(data?.totalItems ?? 0);
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [username]);

  return (
    <section className="mt-10" aria-label="Reviews">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>Reviews</SectionLabel>
        {total > 3 ? (
          <Link
            href={`/profile/${encodeURIComponent(username)}/reviews`}
            className="font-mono text-[10px] tracking-[0.08em] text-accent uppercase hover:underline"
          >
            See all {total}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface-2/40 px-4 sm:px-5">
        {reviews === null ? (
          <div className="flex flex-col gap-4 py-4" aria-hidden="true">
            {[0, 1, 2].map((index) => (
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
        ) : reviews.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-ink-3">No reviews yet.</p>
        ) : (
          <ul>
            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </ul>
        )}
      </div>

      {total > 3 ? (
        <Link
          href={`/profile/${encodeURIComponent(username)}/reviews`}
          className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-line-2/70 px-4 font-mono text-[10px] tracking-[0.08em] text-ink-2 uppercase transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          All reviews · {total}
        </Link>
      ) : null}
    </section>
  );
}
