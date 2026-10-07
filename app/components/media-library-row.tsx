"use client";

import { ChevronRight, Heart } from "lucide-react";
import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import RatingBadge from "@/app/components/rating-badge";
import StatusBadge, { type MediaStatus } from "@/app/components/status-badge";
import { cn } from "@/lib/utils";

export const LIBRARY_GRID_LAYOUT =
  "grid grid-cols-[1fr_auto_24px] lg:grid-cols-[1fr_130px_180px_100px_24px] xl:grid-cols-[1fr_140px_200px_110px_24px] items-center gap-4 px-4";

export type MediaProgressData = {
  current: number;
  total?: number;
  unit?: string;
  isCompleted?: boolean;
};

export function getCompletedProgressLabel(type: MediaType): string {
  switch (type) {
    case "movie":
      return "watched";
    case "game":
      return "completed";
    case "manga":
      return "read";
    default:
      return "completed";
  }
}

function StackedProgressMeter({
  progress,
  type,
}: {
  progress?: MediaProgressData;
  type: MediaType;
}) {
  if (!progress) {
    return <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">—</span>;
  }

  const { current, total, unit = "ep", isCompleted } = progress;

  if (isCompleted && (!total || total <= 1)) {
    return (
      <span className="text-[11px] font-mono lowercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {getCompletedProgressLabel(type)}
      </span>
    );
  }

  if (total && total > 0) {
    const percent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));

    return (
      <div className="flex w-full max-w-[150px] xl:max-w-[170px] flex-col gap-1.5">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${current} of ${total} ${unit}`}
          className="h-[3px] w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        >
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="font-mono text-[11px] leading-none whitespace-nowrap text-zinc-500 dark:text-zinc-400">
          {current}/{total} {unit} · {percent}%
        </p>
      </div>
    );
  }

  return (
    <p className="font-mono text-[11px] leading-none whitespace-nowrap text-zinc-500 dark:text-zinc-400">
      {current} {unit}
    </p>
  );
}

export default function MediaLibraryRow({
  title,
  year,
  studio,
  image,
  type,
  status,
  progress,
  rating,
  isFavorite,
  onClick,
  className,
}: {
  title: string;
  year?: number;
  studio?: string;
  image?: string;
  type: MediaType;
  status: MediaStatus | string;
  progress?: MediaProgressData;
  rating?: number;
  isFavorite?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group w-full border-b border-zinc-200 py-3.5 text-left transition-colors dark:border-zinc-800/80",
        "last:border-b-0 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        LIBRARY_GRID_LAYOUT,
        className,
      )}
    >
      {/* 1. Title Column */}
      <div className="flex min-w-0 items-center gap-3.5">
        <MediaAvatarCard
          title={title}
          year={year}
          image={image}
          type={type}
          size="md"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="truncate text-[14px] font-semibold text-zinc-900 group-hover:text-black transition-colors dark:text-zinc-100 dark:group-hover:text-white">
              {title}
            </p>
            {isFavorite && (
              <Heart
                className="size-3 shrink-0 fill-rose-500 text-rose-500"
                aria-label="Favorite"
              />
            )}
          </div>

          {(year !== undefined || studio) && (
            <p className="mt-1 truncate text-[11px] font-mono tracking-[0.06em] text-zinc-400 dark:text-zinc-500 uppercase">
              {year !== undefined && <span>{year}</span>}
              {year !== undefined && studio && <span> · </span>}
              {studio && <span>{studio.toUpperCase()}</span>}
            </p>
          )}

          {/* Mobile Status / Progress */}
          <div className="mt-2 flex flex-wrap items-center gap-3 lg:hidden">
            <StatusBadge status={status} variant="dot" />
            {progress && (
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                {progress.isCompleted && (!progress.total || progress.total <= 1)
                  ? getCompletedProgressLabel(type)
                  : progress.total
                    ? `${progress.current}/${progress.total} ${progress.unit ?? "ep"}`
                    : `${progress.current} ${progress.unit ?? "ep"}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Status Column */}
      <div className="hidden lg:flex items-center min-w-0">
        <StatusBadge status={status} variant="dot" />
      </div>

      {/* 3. Progress Column */}
      <div className="hidden lg:flex items-center min-w-0">
        <StackedProgressMeter progress={progress} type={type} />
      </div>

      {/* 4. Rating Column */}
      <div className="flex justify-center">
        {rating !== undefined && rating !== null ? (
          <RatingBadge rating={rating} />
        ) : (
          <span className="text-[12px] text-zinc-300 dark:text-zinc-600">—</span>
        )}
      </div>

      {/* 5. Action / Chevron Column */}
      <div className="flex justify-end text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-300">
        <ChevronRight className="size-4" />
      </div>
    </Component>
  );
}
