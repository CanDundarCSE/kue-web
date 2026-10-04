"use client";

import { Globe, Lock, Plus, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import Button from "@/app/components/button";
import { authFetch, readApiError } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

type CustomList = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  itemCount: number;
  previewCoverImages?: string[];
};

type PagedLists = {
  items?: CustomList[];
};

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

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  const Icon = isPublic ? Globe : Lock;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border border-line bg-background px-2 py-0.5",
        "text-[8.5px] font-mono tracking-[0.14em] text-ink-3 uppercase",
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

function ListCard({ list }: { list: CustomList }) {
  return (
    <article className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-[15px] leading-tight font-semibold text-foreground">
          {list.name}
        </h3>
        <VisibilityBadge isPublic={list.isPublic} />
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
    </article>
  );
}

function ListCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-32 animate-pulse rounded-md bg-surface-3" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-surface-3" />
      </div>
      <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-surface-3" />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="size-8 animate-pulse rounded-md bg-surface-3" />
          <div className="size-8 animate-pulse rounded-md bg-surface-3" />
        </div>
        <div className="h-3 w-14 animate-pulse rounded-full bg-surface-3" />
      </div>
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
  onSubmit: (payload: { name: string; description: string; isPublic: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const canSubmit = name.trim().length > 0 && !busy;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), description: description.trim(), isPublic });
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

      <label className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-2">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
          className="size-3.5 accent-[var(--accent)]"
        />
        Public — visible to other Kue users
      </label>

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

export default function Lists({ className }: { className?: string }) {
  const { user, loading } = useCurrentUser();
  const [lists, setLists] = useState<CustomList[] | null>(null);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    async (payload: { name: string; description: string; isPublic: boolean }) => {
      setCreateBusy(true);
      setCreateError(null);

      const response = await authFetch("/api/profile/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
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
          <div className="grid gap-4 sm:grid-cols-2">
            {lists?.map((list) => <ListCard key={list.id} list={list} />)}
          </div>
        )}
      </div>
    </article>
  );
}
