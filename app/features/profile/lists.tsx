"use client";

import { Globe, Loader2, Lock, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "@/app/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Skeleton } from "@/app/components/ui/skeleton";
import LibraryMediaPicker, {
  type PickerMedia,
} from "@/app/features/reviews/library-media-picker";
import { authFetch, readApiError } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

type ListVisibility = "public" | "friends" | "private";

type CustomList = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  visibility?: string;
  itemCount: number;
  previewCoverImages?: string[];
};

type CustomListItem = {
  id: number;
  listId: number;
  mediaId: number;
  order: number;
  notes?: string | null;
  media: {
    id: number;
    title: string;
    mediaType: string;
    coverImage?: string | null;
    year?: number | null;
  };
};

type CustomListDetail = CustomList & { items?: CustomListItem[] };

type PagedLists = {
  items?: CustomList[];
};

const VISIBILITY_OPTIONS: {
  value: ListVisibility;
  label: string;
  help: string;
  Icon: typeof Globe;
}[] = [
  {
    value: "public",
    label: "Public",
    help: "Anyone who opens your profile can see this list.",
    Icon: Globe,
  },
  {
    value: "friends",
    label: "Friends",
    help: "Only you and your friends can see this list.",
    Icon: Users,
  },
  {
    value: "private",
    label: "Private",
    help: "Only you can see this list.",
    Icon: Lock,
  },
];

function visibilityOf(list: { visibility?: string; isPublic?: boolean }): ListVisibility {
  if (list.visibility === "public" || list.visibility === "friends" || list.visibility === "private") {
    return list.visibility;
  }
  return list.isPublic === false ? "private" : "public";
}

function mediaTypeLabel(value: string): string {
  switch (value) {
    case "anime":
      return "Anime";
    case "series":
      return "Series";
    case "manga":
      return "Manga";
    case "game":
      return "Game";
    default:
      return "Movie";
  }
}

function coversOf(items: CustomListItem[]): string[] {
  return items
    .map((item) => item.media.coverImage)
    .filter((cover): cover is string => typeof cover === "string" && cover.length > 0)
    .slice(0, 4);
}

async function fetchMyLists(): Promise<CustomList[]> {
  const response = await authFetch("/api/profile/lists", { cache: "no-store" });
  if (!response.ok) throw new Error("load failed");

  const data = (await response.json()) as PagedLists;
  return Array.isArray(data.items) ? data.items : [];
}

// Single-flight, mirroring the continue-list pattern: concurrent mounts reuse
// the in-flight promise; it is cleared on settle so later visits refetch.
let inFlightLists: Promise<CustomList[]> | null = null;

function fetchMyListsOnce(): Promise<CustomList[]> {
  if (!inFlightLists) {
    inFlightLists = fetchMyLists().finally(() => {
      inFlightLists = null;
    });
  }
  return inFlightLists;
}

function VisibilityBadge({ visibility }: { visibility: ListVisibility }) {
  const option = VISIBILITY_OPTIONS.find((item) => item.value === visibility)!;
  const Icon = option.Icon;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border border-line bg-background px-2 py-0.5",
        "text-[8.5px] font-mono tracking-[0.14em] text-ink-3 uppercase",
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {option.label}
    </span>
  );
}

function VisibilityPicker({
  value,
  onChange,
  disabled,
}: {
  value: ListVisibility;
  onChange: (value: ListVisibility) => void;
  disabled?: boolean;
}) {
  const active = VISIBILITY_OPTIONS.find((option) => option.value === value)!;

  return (
    <div>
      <div role="radiogroup" aria-label="Who can see this list" className="grid grid-cols-3 gap-1.5">
        {VISIBILITY_OPTIONS.map((option) => {
          const Icon = option.Icon;
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5",
                "text-[10px] font-mono tracking-[0.08em] uppercase",
                "transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                "disabled:pointer-events-none disabled:opacity-50",
                selected
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line-2/70 text-ink-2 hover:bg-surface-3 hover:text-foreground",
              )}
            >
              <Icon className="size-3" strokeWidth={2} />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">{active.help}</p>
    </div>
  );
}

function ListCard({ list, onOpen }: { list: CustomList; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border border-line bg-surface-2 p-4 text-left",
        "transition-colors duration-150 motion-reduce:transition-none hover:border-line-2 hover:bg-surface-3/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-[15px] leading-tight font-semibold text-foreground">
          {list.name}
        </h3>
        <VisibilityBadge visibility={visibilityOf(list)} />
      </div>

      {list.description ? (
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">
          {list.description}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5" aria-hidden="true">
          {(list.previewCoverImages ?? []).length > 0 ? (
            (list.previewCoverImages ?? []).slice(0, 4).map((cover, index) => (
              <div
                key={index}
                className="relative size-8 shrink-0 overflow-hidden rounded-md border border-line"
              >
                <Image src={cover} alt="" fill sizes="32px" className="object-cover" />
              </div>
            ))
          ) : (
            [0, 1].map((index) => (
              <span key={index} className="size-8 shrink-0 rounded-md border border-line bg-surface-3" />
            ))
          )}
        </div>
        <span className="shrink-0 text-[10px] font-mono tracking-[0.1em] text-ink-3 uppercase">
          {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
        </span>
      </div>
    </button>
  );
}

export function ListCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-4/5 rounded-full" />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <Skeleton className="h-3 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ListsSkeleton() {
  return (
    <div aria-hidden="true" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ListCardSkeleton />
      <ListCardSkeleton />
    </div>
  );
}

function CreateListForm({
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (payload: { name: string; description: string; visibility: ListVisibility }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ListVisibility>("public");

  const canSubmit = name.trim().length > 0 && !busy;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), description: description.trim(), visibility });
  };

  const inputClasses = cn(
    "w-full rounded-lg border border-line-2/70 bg-background px-3 py-2 text-[13px] text-foreground",
    "placeholder:text-ink-3",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  );

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="new-list-name" className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          New list
        </label>
        <button
          type="button"
          aria-label="Cancel"
          onClick={onCancel}
          className={cn(
            "grid size-6 place-items-center rounded-md text-ink-3",
            "transition-colors duration-150 motion-reduce:transition-none hover:bg-surface-3 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      <input
        id="new-list-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Late night anime"
        maxLength={150}
        autoFocus
        className={cn(inputClasses, "mt-2")}
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description (optional)"
        maxLength={1000}
        rows={2}
        className={cn(inputClasses, "mt-2 resize-none")}
      />

      <div className="mt-3">
        <VisibilityPicker value={visibility} onChange={setVisibility} disabled={busy} />
      </div>

      {error && <p className="mt-2 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{error}</p>}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button size="sm" type="submit" disabled={!canSubmit}>
          {busy ? "Creating…" : "Create list"}
        </Button>
      </div>
    </form>
  );
}

function AddMediaPicker({
  listId,
  items,
  onAdded,
  onCancel,
}: {
  listId: number;
  items: CustomListItem[];
  onAdded: (item: CustomListItem) => void;
  onCancel: () => void;
}) {
  const [busyMediaId, setBusyMediaId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alreadyInList = useMemo(() => new Set(items.map((item) => item.mediaId)), [items]);

  const add = async (media: PickerMedia) => {
    if (busyMediaId !== null || alreadyInList.has(media.mediaId)) return;

    setBusyMediaId(media.mediaId);
    setError(null);

    const response = await authFetch(`/api/profile/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: media.mediaId }),
    }).catch(() => null);

    setBusyMediaId(null);

    if (!response || !response.ok) {
      setError(
        response ? await readApiError(response, "Couldn't add that title.") : "Couldn't reach the server.",
      );
      return;
    }

    const item = (await response.json().catch(() => null)) as CustomListItem | null;
    if (item) onAdded(item);
  };

  return (
    <div className="rounded-lg border border-line-2/70 bg-background p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
          From your library
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close library picker"
          className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-surface-3 hover:text-foreground"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      {error && <p className="mb-2 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{error}</p>}

      <LibraryMediaPicker
        value={null}
        disabledMediaIds={alreadyInList}
        disabledLabel="In list"
        busyMediaId={busyMediaId}
        emptyHint="Add a title to your library first, then add it to this list."
        onChange={(media) => void add(media)}
      />
    </div>
  );
}

function ListDetailDialog({
  list,
  onClose,
  onChanged,
  onDeleted,
}: {
  list: CustomList;
  onClose: () => void;
  onChanged: (patch: { id: number } & Partial<CustomList>) => void;
  onDeleted: (id: number) => void;
}) {
  const [detail, setDetail] = useState<CustomListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description ?? "");
  const [visibility, setVisibility] = useState<ListVisibility>(visibilityOf(list));
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [adding, setAdding] = useState(false);
  const [busyMediaId, setBusyMediaId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      setLoading(true);
      setLoadError(null);

      void authFetch(`/api/profile/lists/${list.id}`, { cache: "no-store" })
        .then(async (response) => {
          if (cancelled) return;
          if (!response.ok) {
            setLoadError(await readApiError(response, "Couldn't load this list."));
            return;
          }
          const data = (await response.json().catch(() => null)) as CustomListDetail | null;
          if (!data) {
            setLoadError("Couldn't load this list.");
            return;
          }
          setDetail(data);
          setName(data.name);
          setDescription(data.description ?? "");
          setVisibility(visibilityOf(data));
        })
        .catch(() => {
          if (!cancelled) setLoadError("Couldn't load this list.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [list.id]);

  const items = detail?.items ?? [];
  const currentVisibility = detail ? visibilityOf(detail) : visibilityOf(list);

  const applyItems = (next: CustomListItem[]) => {
    setDetail((prev) => (prev ? { ...prev, items: next, itemCount: next.length } : prev));
    onChanged({ id: list.id, itemCount: next.length, previewCoverImages: coversOf(next) });
  };

  const startEditing = () => {
    setName(detail?.name ?? list.name);
    setDescription(detail?.description ?? "");
    setVisibility(currentVisibility);
    setActionError(null);
    setConfirmDelete(false);
    setEditing(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setActionError("Give the list a name.");
      return;
    }

    setSaving(true);
    setActionError(null);

    const response = await authFetch(`/api/profile/lists/${list.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmed,
        description: description.trim(),
        visibility,
      }),
    }).catch(() => null);

    setSaving(false);

    if (!response || !response.ok) {
      setActionError(
        response ? await readApiError(response, "Couldn't save the list.") : "Couldn't reach the server.",
      );
      return;
    }

    const updated = (await response.json().catch(() => null)) as CustomList | null;
    if (updated) {
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      onChanged(updated);
    }
    setEditing(false);
  };

  const remove = async (item: CustomListItem) => {
    if (busyMediaId !== null) return;
    setBusyMediaId(item.mediaId);
    setActionError(null);

    const response = await authFetch(
      `/api/profile/lists/${list.id}/items/${item.mediaId}`,
      { method: "DELETE" },
    ).catch(() => null);

    setBusyMediaId(null);

    if (!response || !response.ok) {
      setActionError(
        response ? await readApiError(response, "Couldn't remove that title.") : "Couldn't reach the server.",
      );
      return;
    }

    applyItems(items.filter((entry) => entry.mediaId !== item.mediaId));
  };

  const removeList = async () => {
    setDeleting(true);
    setActionError(null);

    const response = await authFetch(`/api/profile/lists/${list.id}`, {
      method: "DELETE",
    }).catch(() => null);

    setDeleting(false);

    if (!response || !response.ok) {
      setActionError(
        response ? await readApiError(response, "Couldn't delete the list.") : "Couldn't reach the server.",
      );
      return;
    }

    onDeleted(list.id);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[86vh] w-[min(94vw,42rem)] overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle className="truncate font-serif text-[clamp(20px,3vw,26px)] leading-tight">
                {editing ? "Edit list" : detail?.name ?? list.name}
              </DialogTitle>
              <DialogDescription className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono tracking-[0.08em] uppercase">
                <VisibilityBadge visibility={currentVisibility} />
                <span className="text-ink-3">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </DialogDescription>
            </div>
            {!editing && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={startEditing}
                  aria-label="Edit list"
                  className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-foreground"
                >
                  <Pencil className="size-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(true);
                    setActionError(null);
                  }}
                  aria-label="Delete list"
                  className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-[#C4533C]"
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {loadError ? (
          <p className="mt-4 rounded-lg border border-line bg-surface-2/60 p-4 text-center text-[13px] text-ink-2">
            {loadError}
          </p>
        ) : loading ? (
          <div className="mt-5 space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : editing ? (
          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={150}
              placeholder="List name"
              className={cn(
                "w-full rounded-lg border border-line-2/70 bg-background px-3 py-2 text-[13px] text-foreground",
                "placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              )}
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Description (optional)"
              className={cn(
                "w-full resize-none rounded-lg border border-line-2/70 bg-background px-3 py-2 text-[13px] text-foreground",
                "placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              )}
            />
            <VisibilityPicker value={visibility} onChange={setVisibility} disabled={saving} />

            {actionError && (
              <p className="text-[12px] text-[#C4533C] dark:text-[#D9705A]">{actionError}</p>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void save()} disabled={saving || !name.trim()}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {detail?.description ? (
              <p className="text-[13px] leading-relaxed text-ink-2">{detail.description}</p>
            ) : null}

            {confirmDelete && (
              <div className="mt-4 rounded-lg border border-[#C4533C]/40 bg-[#C4533C]/5 p-3">
                <p className="text-[13px] text-foreground">
                  Delete &ldquo;{detail?.name ?? list.name}&rdquo;? This can&apos;t be undone.
                </p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                    Keep list
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void removeList()}
                    disabled={deleting}
                    className="text-[#C4533C] dark:text-[#D9705A]"
                  >
                    {deleting ? "Deleting…" : "Delete list"}
                  </Button>
                </div>
              </div>
            )}

            {actionError && !confirmDelete && (
              <p className="mt-3 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{actionError}</p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                Titles
              </span>
              {!adding && (
                <button
                  type="button"
                  onClick={() => {
                    setAdding(true);
                    setActionError(null);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-md border border-line-2/70 px-2.5 py-1",
                    "text-[10px] font-mono tracking-[0.1em] text-ink-2 uppercase",
                    "transition-colors duration-150 motion-reduce:transition-none hover:bg-surface-3 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  )}
                >
                  <Plus className="size-3" strokeWidth={2} />
                  Add media
                </button>
              )}
            </div>

            {adding && (
              <div className="mt-3">
                <AddMediaPicker
                  listId={list.id}
                  items={items}
                  onCancel={() => setAdding(false)}
                  onAdded={(item) => applyItems([...items, item])}
                />
              </div>
            )}

            {items.length === 0 ? (
              <div className="mt-3 flex flex-col items-center rounded-lg border border-line bg-surface-2/60 px-6 py-8 text-center">
                <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
                  This list is empty
                </span>
                <p className="mt-2 max-w-xs text-[12.5px] leading-relaxed text-ink-2">
                  Add movies, series, games, anime or manga to build it out.
                </p>
                {!adding && (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mt-3 inline-flex items-center gap-1 rounded-md border border-line-2/70 px-2.5 py-1 text-[10px] font-mono tracking-[0.1em] text-ink-2 uppercase hover:bg-surface-3 hover:text-foreground"
                  >
                    <Plus className="size-3" strokeWidth={2} />
                    Add media
                  </button>
                )}
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-line/70">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-line bg-surface-3">
                      {item.media.coverImage ? (
                        <Image
                          src={item.media.coverImage}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {item.media.title}
                      </p>
                      <p className="truncate text-[10px] font-mono tracking-[0.08em] text-ink-3 uppercase">
                        {[item.media.year ? String(item.media.year) : null, mediaTypeLabel(item.media.mediaType)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(item)}
                      disabled={busyMediaId !== null}
                      aria-label={`Remove ${item.media.title}`}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-[#C4533C] disabled:pointer-events-none disabled:opacity-40"
                    >
                      {busyMediaId === item.mediaId ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <X className="size-3.5" strokeWidth={2} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Lists({ className }: { className?: string }) {
  const { user, loading } = useCurrentUser();
  const [lists, setLists] = useState<CustomList[] | null>(null);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [openList, setOpenList] = useState<CustomList | null>(null);

  const load = useCallback(async () => {
    try {
      setLists(await fetchMyListsOnce());
      setError(false);
    } catch {
      setLists(null);
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (loading || user === null) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchMyListsOnce();
        if (cancelled) return;
        setLists(data);
        setError(false);
      } catch {
        if (cancelled) return;
        setLists(null);
        setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const createList = useCallback(
    async (payload: { name: string; description: string; visibility: ListVisibility }) => {
      setCreateBusy(true);
      setCreateError(null);

      const response = await authFetch("/api/profile/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (!response) {
        setCreateError("Couldn't reach the server.");
      } else if (response.ok) {
        const created = (await response.json()) as CustomList;
        setLists((prev) =>
          prev === null ? [created] : [created, ...prev.filter((item) => item.id !== created.id)],
        );
        setCreating(false);
      } else {
        setCreateError(await readApiError(response, "Could not create the list."));
      }

      setCreateBusy(false);
    },
    [],
  );

  const updateCard = useCallback((patch: { id: number } & Partial<CustomList>) => {
    setLists((prev) =>
      prev === null ? prev : prev.map((item) => (item.id === patch.id ? { ...item, ...patch } : item)),
    );
    setOpenList((prev) => (prev && prev.id === patch.id ? { ...prev, ...patch } : prev));
  }, []);

  const deleteCard = useCallback((id: number) => {
    setLists((prev) => (prev === null ? prev : prev.filter((item) => item.id !== id)));
    setOpenList((prev) => (prev && prev.id === id ? null : prev));
  }, []);

  if (error) {
    return (
      <article className={cn("rounded-xl border border-line bg-surface-2 p-5 sm:p-6", className)}>
        <div className="mt-8 flex flex-col items-center gap-3 px-2 py-8 text-center">
          <p className="text-[13px] text-ink-2">Couldn&rsquo;t load your lists.</p>
          <button
            type="button"
            onClick={() => void load()}
            className={cn(
              "rounded-md border border-line-2/70 px-3 py-1.5 text-[11px] font-mono tracking-[0.08em] text-ink-2 uppercase",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            Try again
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("rounded-xl border border-line bg-surface-2 p-5 sm:p-6", className)}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono tracking-[0.18em] text-ink-3 uppercase">
          Lists
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        {!creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setCreateError(null);
            }}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-md border border-line-2/70 px-2.5 py-1",
              "text-[10px] font-mono tracking-[0.1em] text-ink-2 uppercase",
              "transition-colors duration-150 motion-reduce:transition-none hover:bg-surface-3 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            )}
          >
            <Plus className="size-3" strokeWidth={2} />
            New list
          </button>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {creating && (
          <CreateListForm
            busy={createBusy}
            error={createError}
            onCancel={() => {
              setCreating(false);
              setCreateError(null);
            }}
            onSubmit={(payload) => void createList(payload)}
          />
        )}

        {lists === null ? (
          <>
            <ListCardSkeleton />
            <ListCardSkeleton />
          </>
        ) : lists.length === 0 && !creating ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">
              No lists yet
            </span>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
              Create a list to group titles by mood, platform, or anything else
              that floats your boat.
            </p>
          </div>
        ) : (
          <div className="max-h-[26rem] overflow-y-auto pr-1 pb-1 [scrollbar-gutter:stable] [scrollbar-width:thin]">
            <div className="grid gap-4 sm:grid-cols-2">
              {lists?.map((list) => (
                <ListCard key={list.id} list={list} onOpen={() => setOpenList(list)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {openList && (
        <ListDetailDialog
          list={openList}
          onClose={() => setOpenList(null)}
          onChanged={updateCard}
          onDeleted={deleteCard}
        />
      )}
    </article>
  );
}
