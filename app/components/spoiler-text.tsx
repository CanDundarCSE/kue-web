"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

import { splitSpoilerSegments, type SpoilerRange } from "@/lib/spoilers";
import { cn } from "@/lib/utils";

// Renders review text with spoiler spans blurred until clicked. Each masked
// segment reveals independently; state is local so nothing leaks between
// cards. When there are no valid ranges (or the whole-review flag stands
// alone), the text renders plainly — or fully masked via `maskAll`.
export default function SpoilerText({
  content,
  spoilers,
  maskAll = false,
  className,
}: {
  content: string;
  spoilers?: readonly SpoilerRange[] | null;
  maskAll?: boolean;
  className?: string;
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const segments = maskAll
    ? [{ text: content, spoiler: true }]
    : splitSpoilerSegments(content, spoilers ?? []);

  if (segments.every((segment) => !segment.spoiler)) {
    return <span className={className}>{content}</span>;
  }

  const toggle = (index: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (!segment.spoiler) return <span key={index}>{segment.text}</span>;

        const isRevealed = revealed.has(index);
        return (
          <button
            key={index}
            type="button"
            onClick={() => toggle(index)}
            aria-label={isRevealed ? "Hide spoiler" : "Reveal spoiler"}
            title={isRevealed ? "Hide spoiler" : "Reveal spoiler"}
            className={cn(
              "rounded px-0.5 transition-all duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              isRevealed
                ? "bg-accent/10 text-foreground"
                : "cursor-pointer bg-ink-3/20 text-transparent select-none hover:bg-ink-3/30",
            )}
          >
            <span
              aria-hidden={isRevealed ? undefined : true}
              className={cn(!isRevealed && "blur-[4px]")}
            >
              {segment.text}
            </span>
            {!isRevealed && (
              <span className="sr-only">Spoiler, activate to reveal</span>
            )}
            {isRevealed ? null : (
              <Eye
                aria-hidden="true"
                className="mx-1 inline size-3 text-ink-2"
              />
            )}
          </button>
        );
      })}
    </span>
  );
}
