"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const TOTAL = 327;
const START = 140;

export default function VagabondDemo() {
  const [current, setCurrent] = useState(START);
  const percent = Math.round((current / TOTAL) * 100);
  const finished = current >= TOTAL;

  const bump = (delta: number) => {
    setCurrent(Math.max(0, Math.min(TOTAL, current + delta)));
  };

  return (
    <div>
      <p className="mb-3 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        Vagabond · Takehiko Inoue
      </p>

      <span className="block h-0.5 overflow-hidden rounded-full bg-line">
        <span
          className={[
            "block h-full rounded-full transition-[width] duration-300",
            finished ? "bg-accent" : "bg-ink",
          ].join(" ")}
          style={{ width: `${percent}%` }}
        />
      </span>

      <div className="mt-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => bump(-1)}
          aria-label="Decrease chapters read"
          className="grid size-7 shrink-0 place-items-center rounded-lg border border-line-2 bg-surface text-ink-2 transition-colors hover:text-ink active:scale-90"
        >
          <Minus aria-hidden="true" className="size-3.5" />
        </button>
        <span className="min-w-[96px] text-[12px] text-ink-2">
          <b className="text-ink">{current}</b> / {TOTAL} ch · <b className="text-ink">{percent}%</b>
        </span>
        <button
          type="button"
          onClick={() => bump(1)}
          aria-label="Increase chapters read"
          className="grid size-7 shrink-0 place-items-center rounded-lg border border-line-2 bg-surface text-ink-2 transition-colors hover:text-ink active:scale-90"
        >
          <Plus aria-hidden="true" className="size-3.5" />
        </button>
        <span className="ml-auto flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.12em] text-ink-2 uppercase">
          <span
            aria-hidden="true"
            className={[
              "size-1.5 rounded-full",
              finished ? "bg-media-game" : "bg-media-series",
            ].join(" ")}
          />
          {finished ? "Done" : "On hold"}
        </span>
      </div>
    </div>
  );
}
