import { BookOpen, Check, Eye, EyeOff, Gamepad2, ListPlus, Pause, Play, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MediaStatus =
  | "watching"
  | "playing"
  | "reading"
  | "hold"
  | "on_hold"
  | "done"
  | "completed"
  | "watched"
  | "dropped"
  | "unwatched"
  | "planning"
  | "planned"
  | "in_progress";

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

type StatusMeta = {
  label: string;
  icon: LucideIcon;
  className: string;
  dotColor: string;
};

const STATUS_CONFIG: Record<string, StatusMeta> = {
  watching: { label: "Watching", icon: Play, className: TONE.indigo, dotColor: "bg-[#4d7cfe] dark:bg-[#6b7bf5]" },
  playing: { label: "Playing", icon: Gamepad2, className: TONE.emerald, dotColor: "bg-[#4d7cfe] dark:bg-[#6b7bf5]" },
  reading: { label: "Reading", icon: BookOpen, className: TONE.amber, dotColor: "bg-[#4d7cfe] dark:bg-[#6b7bf5]" },
  in_progress: { label: "In progress", icon: Play, className: TONE.indigo, dotColor: "bg-[#4d7cfe] dark:bg-[#6b7bf5]" },
  hold: { label: "On hold", icon: Pause, className: TONE.neutral, dotColor: "bg-amber-400" },
  on_hold: { label: "On hold", icon: Pause, className: TONE.neutral, dotColor: "bg-amber-400" },
  done: { label: "Done", icon: Check, className: TONE.solid, dotColor: "bg-emerald-500" },
  completed: { label: "Completed", icon: Check, className: TONE.solid, dotColor: "bg-emerald-500" },
  watched: { label: "Watched", icon: Eye, className: TONE.solid, dotColor: "bg-emerald-500" },
  dropped: { label: "Dropped", icon: X, className: TONE.rose, dotColor: "bg-rose-500" },
  planning: { label: "Planned", icon: ListPlus, className: TONE.neutral, dotColor: "bg-zinc-400" },
  planned: { label: "Planned", icon: ListPlus, className: TONE.neutral, dotColor: "bg-zinc-400" },
  unwatched: { label: "Unwatched", icon: EyeOff, className: TONE.hollow, dotColor: "bg-zinc-500" },
};

export default function StatusBadge({
  status,
  variant = "badge",
  className,
}: {
  status: MediaStatus | string;
  variant?: "badge" | "dot";
  className?: string;
}) {
  const normalized = status.toLowerCase();
  const config = STATUS_CONFIG[normalized] ?? {
    label: status.replace(/_/g, " "),
    icon: Play,
    className: TONE.neutral,
    dotColor: "bg-zinc-400",
  };

  const { label, icon: Icon, className: tone, dotColor } = config;

  if (variant === "dot") {
    return (
      <span
        className={[
          "inline-flex shrink-0 items-center gap-2 text-[11px] font-mono font-medium tracking-[0.14em] uppercase text-zinc-600 dark:text-zinc-300",
          className ?? "",
        ].join(" ")}
      >
        <span aria-hidden="true" className={["size-1.5 shrink-0 rounded-full", dotColor].join(" ")} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[10px] leading-none font-semibold tracking-[0.1em] uppercase",
        tone,
        className ?? "",
      ].join(" ")}
    >
      <Icon className={["size-3", normalized === "watching" ? "fill-current" : ""].join(" ")} />
      {label}
    </span>
  );
}
