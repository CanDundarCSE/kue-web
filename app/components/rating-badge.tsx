import { Star } from "lucide-react";

function ratingTone(rating: number) {
  if (rating >= 9.5)
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300";
  if (rating >= 8)
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";
  if (rating >= 6)
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300";
  return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300";
}

export default function RatingBadge({
  rating,
  max = 10,
  className,
}: {
  rating: number;
  max?: number;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[11px] leading-none font-semibold",
        ratingTone(rating),
        className ?? "",
      ].join(" ")}
    >
      <Star className="size-3 fill-current" />
      {rating.toFixed(1)}
      <span className="font-normal opacity-60">/{max}</span>
    </span>
  );
}
