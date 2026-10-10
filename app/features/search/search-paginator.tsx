"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PageItem = number | "start-ellipsis" | "end-ellipsis";

/**
 * Builds a compact page list with ellipses: 1 … 4 5 6 … 20
 * Always keeps the first and last page visible so the ends stay reachable.
 */
export function buildPageItems(
  currentPage: number,
  totalPages: number,
  siblings = 1,
): PageItem[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];

  const slots = siblings * 2 + 5; // first + last + siblings + 2 ellipses
  if (totalPages <= slots) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const left = Math.max(currentPage - siblings, 1);
  const right = Math.min(currentPage + siblings, totalPages);
  const items: PageItem[] = [1];

  if (left > 2) items.push("start-ellipsis");

  for (let page = left; page <= right; page++) {
    if (page === 1 || page === totalPages) continue;
    items.push(page);
  }

  if (right < totalPages - 1) items.push("end-ellipsis");

  items.push(totalPages);
  return items;
}

const navButtonClass = cn(
  "grid size-9 shrink-0 place-items-center rounded-md border border-line-2/70 text-ink-2",
  "transition-colors duration-150 motion-reduce:transition-none",
  "hover:bg-surface-3 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  "disabled:pointer-events-none disabled:opacity-40",
);

export default function SearchPaginator({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) return null;

  const items = buildPageItems(currentPage, totalPages);
  const canGoBack = currentPage > 1 && !disabled;
  const canGoForward = currentPage < totalPages && !disabled;

  return (
    <nav aria-label="Search results pages" className="mt-6">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoBack}
            aria-label="Previous page"
            className={navButtonClass}
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </button>
        </li>

        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                aria-current={item === currentPage ? "page" : undefined}
                onClick={() => onPageChange(item)}
                disabled={disabled}
                className={cn(
                  "grid h-9 min-w-9 place-items-center rounded-md border px-2.5 font-mono text-[12px]",
                  "transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  "disabled:pointer-events-none disabled:opacity-40",
                  item === currentPage
                    ? "border-transparent bg-foreground text-background"
                    : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {item}
              </button>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className="grid h-9 min-w-6 place-items-center font-mono text-[12px] text-ink-3"
            >
              &hellip;
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoForward}
            aria-label="Next page"
            className={navButtonClass}
          >
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </li>
      </ul>
    </nav>
  );
}