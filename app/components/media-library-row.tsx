import { ChevronRight } from "lucide-react";
import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import RatingBadge from "@/app/components/rating-badge";
import StatusBadge, { type MediaStatus } from "@/app/components/status-badge";

function ProgressMeter({
  current,
  total,
  unit,
}: {
  current: number;
  total: number;
  unit: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${current} of ${total} ${unit}`}
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1e40af]/12 dark:bg-[#6b7bf5]/20"
      >
        <div
          className="h-full rounded-full bg-[#1e40af] dark:bg-[#6b7bf5]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="shrink-0 text-[11px] leading-none whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        <span className="text-zinc-700 dark:text-zinc-200">
          {current}/{total}
        </span>{" "}
        {unit} · {percent}%
      </p>
    </div>
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
  className,
}: {
  title: string;
  year?: number;
  studio?: string;
  image?: string;
  type: MediaType;
  status: MediaStatus;
  progress?: { current: number; total: number; unit: string };
  rating?: number;
  className?: string;
}) {
  return (
    <div
      className={[
        "border-b border-zinc-200 px-3 py-3.5 last:border-b-0 sm:px-4",
        "dark:border-zinc-800",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 sm:gap-4 lg:items-center">
        <MediaAvatarCard title={title} year={year} image={image} type={type} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-tight font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </p>

          {(year !== undefined || studio) && (
            <p className="mt-1 truncate text-[11px] leading-none text-zinc-500 dark:text-zinc-400">
              {year !== undefined && <span>{year}</span>}
              {year !== undefined && studio && <span> · </span>}
              {studio && <span className="tracking-[0.08em]">{studio.toUpperCase()}</span>}
            </p>
          )}

          <div className="mt-2.5 lg:hidden">
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="hidden w-28 shrink-0 lg:block">
          <StatusBadge status={status} />
        </div>

        {progress && (
          <div className="hidden w-44 shrink-0 lg:block xl:w-52">
            <ProgressMeter {...progress} />
          </div>
        )}

        {rating !== undefined && (
          <div className="shrink-0 self-start lg:self-center">
            <RatingBadge rating={rating} />
          </div>
        )}

        <ChevronRight className="size-4 shrink-0 self-start text-zinc-300 lg:self-center dark:text-zinc-600" />
      </div>

      {progress && (
        <div className="mt-3 lg:hidden">
          <ProgressMeter {...progress} />
        </div>
      )}
    </div>
  );
}
