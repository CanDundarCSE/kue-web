"use client";

import { cn } from "@/lib/utils";

export const SCOPE_OPTIONS = [
  { id: "movie", label: "Film" },
  { id: "series", label: "Series" },
  { id: "game", label: "Game" },
  { id: "anime", label: "Anime" },
  { id: "manga", label: "Manga" },
] as const;

const pillClass = (active: boolean) =>
  cn(
    "rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
    active
      ? "bg-foreground font-semibold text-background"
      : "border border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
  );

export default function ScopePicker({
  scope,
  onChange,
}: {
  scope: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(
      scope.includes(id) ? scope.filter((t) => t !== id) : [...scope, id],
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange([])}
        aria-pressed={scope.length === 0}
        className={pillClass(scope.length === 0)}
      >
        All media
      </button>
      {SCOPE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => toggle(option.id)}
          aria-pressed={scope.includes(option.id)}
          className={pillClass(scope.includes(option.id))}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
