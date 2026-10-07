"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import RatingBadge from "@/app/components/rating-badge";
import Button from "@/app/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { cn } from "@/lib/utils";

export type EditableLibraryItem = {
  mediaId: number;
  title: string;
  year?: number;
  studio?: string;
  image?: string;
  type: MediaType;
  status: string;
  current: number;
  total?: number;
  unit: string;
  rating?: number | null;
};

export default function LibraryEntrySheet({
  item,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  item: EditableLibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: EditableLibraryItem) => Promise<void>;
  onDelete?: (mediaId: number) => Promise<void>;
}) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-6 bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800"
      >
        <SheetForm
          key={`${item.mediaId}-${item.status}-${item.current}-${item.rating}`}
          item={item}
          onSave={async (updated) => {
            await onSave(updated);
            onOpenChange(false);
          }}
          onDelete={
            onDelete
              ? async (id) => {
                  await onDelete(id);
                  onOpenChange(false);
                }
              : undefined
          }
        />
      </SheetContent>
    </Sheet>
  );
}

function SheetForm({
  item,
  onSave,
  onDelete,
}: {
  item: EditableLibraryItem;
  onSave: (updated: EditableLibraryItem) => Promise<void>;
  onDelete?: (mediaId: number) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [current, setCurrent] = useState(item.current);
  const [rating, setRating] = useState<number | null>(item.rating ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEpisodic = item.type === "anime" || item.type === "series" || item.type === "manga" || item.type === "game";

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...item,
        status,
        current,
        rating,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm(`Remove "${item.title}" from your library?`)) return;
    setDeleting(true);
    try {
      await onDelete(item.mediaId);
    } finally {
      setDeleting(false);
    }
  };

  // In-progress verbs format-aware
  const inProgressLabel =
    item.type === "manga" ? "Reading" : item.type === "game" ? "Playing" : "Watching";

  const statusOptions = [
    { value: "in_progress", label: inProgressLabel },
    { value: "completed", label: item.type === "movie" ? "Watched" : "Completed" },
    { value: "on_hold", label: "On Hold" },
    { value: "planning", label: "Planned" },
    { value: "dropped", label: "Dropped" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader className="text-left space-y-1">
        <div className="flex items-start gap-4">
          <MediaAvatarCard
            title={item.title}
            year={item.year}
            image={item.image}
            type={item.type}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {item.title}
            </SheetTitle>
            <SheetDescription className="sr-only">Edit library title</SheetDescription>
            <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {item.year !== undefined && <span>{item.year}</span>}
              {item.studio && <span> · {item.studio}</span>}
              <span> · {item.type}</span>
            </p>
          </div>
        </div>
      </SheetHeader>

      {/* Status Picker */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono tracking-[0.1em] text-zinc-500 dark:text-zinc-400 uppercase">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {statusOptions.map((opt) => {
            const isSelected =
              status === opt.value ||
              (opt.value === "in_progress" && (status === "watching" || status === "playing" || status === "reading")) ||
              (opt.value === "completed" && (status === "done" || status === "watched"));

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-sky-500 bg-sky-50 text-sky-700 font-semibold dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-300"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Counter */}
      {isEpisodic && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono tracking-[0.1em] text-zinc-500 dark:text-zinc-400 uppercase">
              Progress ({item.unit})
            </label>
            {item.total && (
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                Total: {item.total} {item.unit}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={current <= 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Minus className="size-4" />
            </button>

            <input
              type="number"
              min={0}
              max={item.total ?? 9999}
              value={current}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCurrent(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="h-9 w-24 rounded-lg border border-zinc-200 bg-white px-3 text-center font-mono text-sm text-zinc-900 focus:border-sky-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />

            <button
              type="button"
              disabled={item.total !== undefined && current >= item.total}
              onClick={() => setCurrent((c) => (item.total ? Math.min(item.total, c + 1) : c + 1))}
              className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus className="size-4" />
            </button>

            {item.total && (
              <div className="ml-auto font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {Math.min(100, Math.round((current / item.total) * 100))}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono tracking-[0.1em] text-zinc-500 dark:text-zinc-400 uppercase">
            Rating (1 - 10)
          </label>
          {rating !== null && <RatingBadge rating={rating} />}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setRating(score === rating ? null : score)}
              className={cn(
                "size-8 rounded-lg border text-xs font-mono font-medium transition-colors",
                rating === score
                  ? "border-sky-500 bg-sky-500 text-white font-bold dark:border-sky-500 dark:bg-sky-500 dark:text-zinc-950"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
              )}
            >
              {score}
            </button>
          ))}
          {rating !== null && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="ml-2 px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-700 transition-colors dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-col gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
        </Button>

        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-mono text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-3.5" />}
            Remove from library
          </button>
        )}
      </div>
    </div>
  );
}
