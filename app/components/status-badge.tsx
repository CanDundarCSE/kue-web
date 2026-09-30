import { BookOpen, Check, Eye, EyeOff, Gamepad2, Pause, Play, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MediaStatus =
  | "watching"
  | "playing"
  | "reading"
  | "hold"
  | "done"
  | "watched"
  | "dropped"
  | "unwatched";

const TONE = {
  indigo:
    "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300",
  emerald:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  amber:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  solid:
    "border-emerald-600/40 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950",
  neutral:
    "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  hollow: "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300",
} satisfies Record<string, string>;

const STATUS: Record<MediaStatus, { label: string; icon: LucideIcon; className: string }> = {
  watching: { label: "Watching", icon: Play, className: TONE.indigo },
  playing: { label: "Playing", icon: Gamepad2, className: TONE.emerald },
  reading: { label: "Reading", icon: BookOpen, className: TONE.amber },
  hold: { label: "On hold", icon: Pause, className: TONE.neutral },
  done: { label: "Done", icon: Check, className: TONE.solid },
  watched: { label: "Watched", icon: Eye, className: TONE.solid },
  dropped: { label: "Dropped", icon: X, className: TONE.rose },
  unwatched: { label: "Unwatched", icon: EyeOff, className: TONE.hollow },
};

export default function StatusBadge({
  status,
  className,
}: {
  status: MediaStatus;
  className?: string;
}) {
  const { label, icon: Icon, className: tone } = STATUS[status];

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[10px] leading-none font-semibold tracking-[0.1em] uppercase",
        tone,
        className ?? "",
      ].join(" ")}
    >
      <Icon className={["size-3", status === "watching" ? "fill-current" : ""].join(" ")} />
      {label}
    </span>
  );
}
