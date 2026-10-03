"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { cn } from "@/lib/utils";

type ProgressUnit = "ep" | "h" | "ch";

type ContinueItem = {
  id: string;
  title: string;
  year: number;
  type: MediaType;
  statusLabel: string;
  current: number;
  total: number;
  unit: ProgressUnit;
};

const INITIAL_ITEMS: ContinueItem[] = [
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    year: 2023,
    type: "anime",
    statusLabel: "Watching",
    current: 18,
    total: 28,
    unit: "ep",
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    year: 2022,
    type: "game",
    statusLabel: "Playing",
    current: 84,
    total: 150,
    unit: "h",
  },
  {
    id: "berserk",
    title: "Berserk",
    year: 1998,
    type: "manga",
    statusLabel: "Reading",
    current: 246,
    total: 374,
    unit: "ch",
  },
  {
    id: "severance",
    title: "Severance",
    year: 2022,
    type: "series",
    statusLabel: "Watching",
    current: 9,
    total: 19,
    unit: "ep",
  },
];

function StepButton({
  label,
  onClick,
  disabled,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  icon: typeof Minus;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md border border-line-2/70 text-ink-2",
        "transition-colors duration-150 motion-reduce:transition-none",
        "hover:bg-surface-3 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
    </button>
  );
}

export default function ContinueList({ className }: { className?: string }) {
  const [items, setItems] = useState(INITIAL_ITEMS);

  const step = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              current: Math.min(item.total, Math.max(0, item.current + delta)),
            }
          : item,
      ),
    );
  };

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => {
        const percent =
          item.total > 0 ? Math.round((item.current / item.total) * 100) : 0;

        return (
          <article
            key={item.id}
            className="rounded-xl border border-line bg-surface-2 p-4"
          >
            <div className="flex items-start gap-3">
              <MediaAvatarCard
                title={item.title}
                year={item.year}
                type={item.type}
                size="md"
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span className="truncate text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                    {item.statusLabel}
                  </span>
                </div>

                <p className="mt-1.5 truncate text-[15px] leading-tight font-semibold text-foreground">
                  {item.title}
                </p>

                <div className="mt-auto pt-3">
                  <div
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.title} — ${item.current} of ${item.total} ${item.unit}`}
                    className="h-[3px] w-full overflow-hidden rounded-full bg-line"
                  >
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] leading-none text-ink-3">
                      <span className="text-ink-2">{percent}%</span> ·{" "}
                      {item.current}/{item.total} {item.unit}
                    </span>

                    <div className="flex shrink-0 gap-1">
                      <StepButton
                        label={`Mark ${item.title} behind`}
                        icon={Minus}
                        disabled={item.current <= 0}
                        onClick={() => step(item.id, -1)}
                      />
                      <StepButton
                        label={`Advance ${item.title}`}
                        icon={Plus}
                        disabled={item.current >= item.total}
                        onClick={() => step(item.id, 1)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
