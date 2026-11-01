"use client";

import Link from "next/link";

import RatingBadge from "@/app/components/rating-badge";
import SpoilerText from "@/app/components/spoiler-text";
import type { ReviewDto } from "@/lib/api/reviews";

const TYPE_LABEL: Record<string, string> = {
  movie: "Film",
  series: "Series",
  game: "Game",
  anime: "Anime",
  manga: "Manga",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .replace(/^([a-z])/, (letter) => letter.toUpperCase());
}

/** One review row, used on public profiles and the full review list. */
export default function ReviewRow({
  review,
  clamp = true,
}: {
  review: ReviewDto;
  clamp?: boolean;
}) {
  return (
    <li className="flex gap-3.5 border-b border-line/60 py-4 last:border-b-0">
      {review.mediaCoverImage ? (
        <Link
          href={`/media/${review.mediaId}`}
          className="relative block h-[62px] w-[46px] shrink-0 overflow-hidden rounded-lg border border-line"
          aria-label={review.mediaTitle}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- catalog cover from remote provider */}
          <img
            src={review.mediaCoverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            <Link
              href={`/media/${review.mediaId}`}
              className="truncate text-[14px] font-semibold text-foreground hover:text-accent"
            >
              {review.mediaTitle}
            </Link>
            <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              {[TYPE_LABEL[review.mediaType] ?? review.mediaType, review.mediaYear]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {typeof review.rating === "number" ? <RatingBadge rating={review.rating} /> : null}
            <span className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>

        <div
          className={[
            "mt-2 text-[13px] leading-relaxed text-ink-2",
            clamp ? "line-clamp-3" : "",
          ].join(" ")}
        >
          <SpoilerText
            content={review.content}
            spoilers={review.spoilers ?? []}
            maskAll={review.containsSpoilers && (review.spoilers?.length ?? 0) === 0}
          />
        </div>

        {review.containsSpoilers ? (
          <span className="mt-2 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] tracking-[0.1em] text-amber-500 uppercase">
            Contains spoilers
          </span>
        ) : null}
      </div>
    </li>
  );
}
