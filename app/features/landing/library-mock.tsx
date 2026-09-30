"use client";

import { useState, type ReactNode } from "react";
import { Check, Eye, Minus, Plus } from "lucide-react";
import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import RatingBadge from "@/app/components/rating-badge";
import StatusBadge from "@/app/components/status-badge";
import {
  MEDIA_TYPE_META,
  MOCK_ROWS,
  type LandingRow,
  type LandingStatus,
} from "@/app/features/landing/sample-data";

const TABS: { label: string; type: MediaType | "all" }[] = [
  { label: "All", type: "all" },
  { label: "Film", type: "movie" },
  { label: "Series", type: "series" },
  { label: "Games", type: "game" },
  { label: "Anime", type: "anime" },
  { label: "Manga", type: "manga" },
];

const RESUME: Record<MediaType, LandingStatus> = {
  anime: "watching",
  series: "watching",
  manga: "reading",
  game: "playing",
  movie: "watched",
};

function Stepper({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "grid size-7 shrink-0 place-items-center rounded-lg border border-line-2 bg-surface text-ink-2",
        "transition-[color,border-color,transform] duration-150 active:scale-90 motion-reduce:transition-none",
        "hover:border-line-2 hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function WatchToggle({
  watched,
  title,
  onToggle,
}: {
  watched: boolean;
  title: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={watched}
      aria-label={watched ? `Mark ${title} unwatched` : `Mark ${title} watched`}
      className={[
        "grid size-7 shrink-0 place-items-center rounded-lg border transition-[color,background-color,border-color,transform]",
        "active:scale-90 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        watched
          ? "border-emerald-600/40 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950"
          : "border-line-2 bg-surface text-ink-2 hover:text-ink",
      ].join(" ")}
    >
      {watched ? <Check aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
    </button>
  );
}

function MockRow({
  row,
  onBump,
  onToggleWatched,
}: {
  row: LandingRow;
  onBump: (id: string, delta: number) => void;
  onToggleWatched: (id: string) => void;
}) {
  const percent = Math.min(100, Math.round((row.current / row.total) * 100));
  const isMovie = row.type === "movie";

  return (
    <div className="flex items-center gap-4 border-t border-line px-4 py-3 transition-colors hover:bg-surface-2">
      <MediaAvatarCard title={row.title} year={row.year} type={row.type} image={row.image} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] leading-tight font-semibold">{row.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[9px] font-mono tracking-[0.08em] text-ink-3 uppercase">
          <span
            aria-hidden="true"
            className={["size-1.5 shrink-0 rounded-full", MEDIA_TYPE_META[row.type].dot].join(" ")}
          />
          {MEDIA_TYPE_META[row.type].label} · {row.year}
        </p>

        {!isMovie && (
          <div className="mt-2 flex max-w-[280px] items-center gap-2.5">
            <span className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
              <span
                className={[
                  "block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none",
                  percent >= 100 ? "bg-accent" : "bg-ink",
                ].join(" ")}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="shrink-0 text-[9px] font-mono whitespace-nowrap text-ink-2">
              {row.current}/{row.total} {row.unit} · {percent}%
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <StatusBadge status={row.status} className="hidden min-w-[104px] justify-center sm:inline-flex" />

        <span className="flex w-16 shrink-0 justify-end gap-2">
          {isMovie ? (
            <WatchToggle
              watched={row.status === "watched"}
              title={row.title}
              onToggle={() => onToggleWatched(row.id)}
            />
          ) : (
            <>
              <Stepper label={`Decrease ${row.title}`} onClick={() => onBump(row.id, -1)}>
                <Minus aria-hidden="true" className="size-3.5" />
              </Stepper>
              <Stepper label={`Increase ${row.title}`} onClick={() => onBump(row.id, 1)}>
                <Plus aria-hidden="true" className="size-3.5" />
              </Stepper>
            </>
          )}
        </span>

        <RatingBadge rating={row.score} className="hidden min-w-[84px] justify-center sm:inline-flex" />
      </div>
    </div>
  );
}

export default function LibraryMock() {
  const [rows, setRows] = useState<LandingRow[]>(MOCK_ROWS);
  const [tab, setTab] = useState<MediaType | "all">("all");

  const visible = rows.filter((row) => tab === "all" || row.type === tab);

  const countFor = (type: MediaType | "all") =>
    type === "all" ? rows.length : rows.filter((row) => row.type === type).length;

  const bump = (id: string, delta: number) => {
    const row = rows.find((entry) => entry.id === id);
    if (!row) {
      return;
    }

    const next = Math.max(0, Math.min(row.total, row.current + delta));
    const finished = next >= row.total && row.status !== "done";

    setRows(
      rows.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              current: next,
              status: finished ? "done" : entry.status === "done" ? RESUME[entry.type] : entry.status,
            }
          : entry,
      ),
    );
  };

  const toggleWatched = (id: string) => {
    setRows(
      rows.map((entry) =>
        entry.id === id
          ? { ...entry, status: entry.status === "watched" ? "unwatched" : "watched" }
          : entry,
      ),
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-[var(--shadow)]">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
        <b className="font-normal text-ink">Kue / Library</b>
        <span>· {rows.length} titles</span>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b border-line px-4 [scrollbar-width:none]">
        {TABS.map((entry) => {
          const active = tab === entry.type;

          return (
            <button
              key={entry.type}
              type="button"
              onClick={() => setTab(entry.type)}
              aria-pressed={active}
              className={[
                "-mb-px border-b-2 pt-3 pb-2.5 text-[10px] font-mono tracking-[0.12em] whitespace-nowrap uppercase transition-colors",
                active ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink-2",
              ].join(" ")}
            >
              {entry.label}
              <span className="ml-1 text-accent">{countFor(entry.type)}</span>
            </button>
          );
        })}
      </div>

      <div>
        {visible.map((row) => (
          <MockRow key={row.id} row={row} onBump={bump} onToggleWatched={toggleWatched} />
        ))}
      </div>
    </div>
  );
}
