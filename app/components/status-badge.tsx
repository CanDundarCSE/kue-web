import { BookOpen, Gamepad2, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MediaStatus = "watching" | "playing" | "reading";

const STATUS: Record<MediaStatus, { label: string; icon: LucideIcon; className: string }> = {
  watching: {
    label: "Watching",
    icon: Play,
    className:
      "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300",
  },
  playing: {
    label: "Playing",
    icon: Gamepad2,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  reading: {
    label: "Reading",
    icon: BookOpen,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  },
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
