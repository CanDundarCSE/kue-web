"use client";

import { BookmarkCheck, Check } from "lucide-react";

import { cn } from "@/lib/utils";

// Small "you already have this" marker shared by the search dropdown and the
// full search page. Icon-only by default (compact rows); pill when there is
// room for a label.
export default function LibraryBadge({ variant = "icon" }: { variant?: "icon" | "pill" }) {
  if (variant === "pill") {
    return (
      <span
        title="In your library"
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/10",
          "px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-accent uppercase",
        )}
      >
        <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
        In library
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="In your library"
      title="In your library"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
        "bg-accent/15 text-accent",
      )}
    >
      <BookmarkCheck className="size-3" strokeWidth={2.25} aria-hidden="true" />
    </span>
  );
}
