"use client";

import {
  Database,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  AdminPage,
  ErrorBanner,
  Pagination,
  Panel,
  formatDate,
  inputClass,
  labelClass,
  selectClass,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
} from "@/app/features/admin/admin-ui";
import {
  deleteAdminMedia,
  fetchAdminMedia,
  refreshAdminMedia,
  restoreAdminMedia,
  syncAdminMedia,
  type AdminMedia,
  type PagedResponse,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const MEDIA_TYPES: Array<{ value: MediaType; label: string }> = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
  { value: "game", label: "Game" },
  { value: "anime", label: "Anime" },
  { value: "manga", label: "Manga" },
];
const SOURCES = [
  { value: "tmdb", label: "TMDB" },
  { value: "anilist", label: "AniList" },
  { value: "igdb", label: "IGDB" },
];

function isMediaType(value: string): value is MediaType {
  return MEDIA_TYPES.some((entry) => entry.value === value);
}

function MediaTypeBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-md border border-line-2/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
      {value}
    </span>
  );
}

export default function AdminMediaView() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [externalSource, setExternalSource] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<PagedResponse<AdminMedia> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestRef = useRef(0);

  const [busy, setBusy] = useState<{ id: number; action: "refresh" | "restore" } | null>(null);

  const [syncType, setSyncType] = useState<MediaType>("movie");
  const [syncSource, setSyncSource] = useState("tmdb");
  const [syncExternalId, setSyncExternalId] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminMedia | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const next = await fetchAdminMedia({
        search: search || undefined,
        mediaType: mediaType || undefined,
        externalSource: externalSource || undefined,
        includeDeleted,
        page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== requestRef.current) return;
      setData(next);
      setError(null);
    } catch (cause) {
      if (requestId !== requestRef.current) return;
      setError(cause instanceof Error ? cause.message : "Couldn't load the media catalog.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [externalSource, includeDeleted, mediaType, page, search]);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (!cancelled) void load();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [load]);

  const resetFilters = () => {
    setLoading(true);
    setSearchInput("");
    setSearch("");
    setMediaType("");
    setExternalSource("");
    setIncludeDeleted(false);
    setPage(1);
  };

  const changePage = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  const changeSyncType = (value: MediaType) => {
    setSyncType(value);
    if (value === "game") setSyncSource("igdb");
    else if (value === "anime" || value === "manga") setSyncSource("anilist");
    else setSyncSource("tmdb");
  };

  const runSync = async () => {
    if (!syncExternalId.trim()) return;

    setSyncBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const media = await syncAdminMedia({
        mediaType: syncType,
        externalSource: syncSource,
        externalId: syncExternalId.trim(),
      });
      setSyncExternalId("");
      setNotice(`Synced “${media.title}” into the catalog.`);
      setPage(1);
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't sync this media.");
    } finally {
      setSyncBusy(false);
    }
  };

  const refresh = async (media: AdminMedia) => {
    setBusy({ id: media.id, action: "refresh" });
    setActionError(null);
    setNotice(null);
    try {
      const updated = await refreshAdminMedia(media.id);
      setNotice(`Refreshed metadata for “${updated.title}”.`);
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't refresh this media.");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (media: AdminMedia) => {
    setBusy({ id: media.id, action: "restore" });
    setActionError(null);
    setNotice(null);
    try {
      const updated = await restoreAdminMedia(media.id);
      setNotice(`Restored “${updated.title}”.`);
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't restore this media.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (permanent: boolean) => {
    if (!deleteTarget) return;

    setDeleteBusy(true);
    setDeleteError(null);
    setActionError(null);
    setNotice(null);
    try {
      const message = await deleteAdminMedia(deleteTarget.id, permanent);
      setDeleteTarget(null);
      setNotice(message);
      await load();
    } catch (cause) {
      setDeleteError(
        cause instanceof Error ? cause.message : "Couldn't delete this media record.",
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <AdminPage>
      <div>
        <h1 className="font-serif text-[clamp(26px,3.4vw,36px)] leading-tight tracking-[-0.01em] text-foreground">
          Media<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 text-[13px] text-ink-2">
          Inspect the cached catalog, refresh external metadata, sync new titles and manage
          soft-deleted records.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />

      {notice && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3 text-[13px] text-emerald-700 dark:text-emerald-300">
          <p className="min-w-0 break-words">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 text-[11px] font-medium underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Catalog"
          description="Media cached from TMDB, AniList and IGDB."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setLoading(true);
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="min-w-[200px] flex-1">
              <span className={labelClass}>Search</span>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-3" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Title or external ID"
                  className={cn(inputClass, "pl-8")}
                />
              </div>
            </label>

            <label>
              <span className={labelClass}>Type</span>
              <select
                value={mediaType}
                onChange={(event) => {
                  setLoading(true);
                  setMediaType(event.target.value);
                  setPage(1);
                }}
                className={cn(selectClass, "mt-1 block")}
              >
                <option value="">Any type</option>
                {MEDIA_TYPES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>Source</span>
              <select
                value={externalSource}
                onChange={(event) => {
                  setLoading(true);
                  setExternalSource(event.target.value);
                  setPage(1);
                }}
                className={cn(selectClass, "mt-1 block")}
              >
                <option value="">Any source</option>
                {SOURCES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <Button type="submit" variant="secondary" size="sm" className="h-9">
              <Search className="size-3.5" />
              Search
            </Button>

            {(search || mediaType || externalSource || includeDeleted) && (
              <Button type="button" variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </form>

          <label className="mt-3 flex items-center gap-2 text-[12px] text-ink-2">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => {
                setLoading(true);
                setIncludeDeleted(event.target.checked);
                setPage(1);
              }}
              className="size-4 accent-accent"
            />
            Include soft-deleted records
          </label>

          <div className="mt-4">
            {loading && !data ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className={tableWrapClass}>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={thClass}>Title</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Source</th>
                        <th className={thClass}>External ID</th>
                        <th className={thClass}>Year</th>
                        <th className={thClass}>Score</th>
                        <th className={thClass}>Tracked</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Updated</th>
                        <th className={cn(thClass, "text-right")}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.items ?? []).map((media) => (
                        <tr key={media.id} className="transition-colors hover:bg-surface-3/30">
                          <td className={tdClass}>
                            <div className="flex items-center gap-2.5">
                              <MediaAvatarCard
                                title={media.title}
                                year={media.year ?? undefined}
                                image={media.coverImage ?? undefined}
                                type={isMediaType(media.mediaType) ? media.mediaType : "movie"}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p
                                  className="max-w-[220px] truncate font-medium text-foreground"
                                  title={media.title}
                                >
                                  {media.title}
                                </p>
                                <p className="font-mono text-[10px] text-ink-3">#{media.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <MediaTypeBadge value={media.mediaType} />
                          </td>
                          <td className={tdClass}>{media.externalSource}</td>
                          <td className={tdClass}>
                            <span
                              className="block max-w-[120px] truncate font-mono text-[11px]"
                              title={media.externalId}
                            >
                              {media.externalId}
                            </span>
                          </td>
                          <td className={tdClass}>{media.year ?? "—"}</td>
                          <td className={tdClass}>
                            {media.score === null ? "—" : media.score.toFixed(1)}
                          </td>
                          <td className={tdClass}>{media.trackedCount}</td>
                          <td className={tdClass}>
                            {media.isDeleted ? (
                              <span className="inline-flex rounded-md border border-red-500/30 bg-red-500/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-red-600 dark:text-red-400">
                                Deleted
                              </span>
                            ) : (
                              <span className="inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
                                Active
                              </span>
                            )}
                          </td>
                          <td className={tdClass}>{formatDate(media.updatedAt)}</td>
                          <td className={cn(tdClass, "text-right")}>
                            <div className="flex justify-end gap-0.5">
                              {media.isDeleted ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Restore media"
                                  aria-label={`Restore ${media.title}`}
                                  disabled={busy?.id === media.id}
                                  onClick={() => void restore(media)}
                                >
                                  {busy?.id === media.id && busy.action === "restore" ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <RotateCcw className="size-3.5" />
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Refresh metadata"
                                  aria-label={`Refresh ${media.title}`}
                                  disabled={busy?.id === media.id}
                                  onClick={() => void refresh(media)}
                                >
                                  {busy?.id === media.id && busy.action === "refresh" ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="size-3.5" />
                                  )}
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="Delete media"
                                aria-label={`Delete ${media.title}`}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => {
                                  setDeleteTarget(media);
                                  setDeleteError(null);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && (data?.items.length ?? 0) === 0 && (
                        <tr>
                          <td className={cn(tdClass, "text-center text-ink-3")} colSpan={10}>
                            No media matches these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {data && (
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    totalItems={data.totalItems}
                    onPage={changePage}
                    busy={loading}
                  />
                )}
              </>
            )}
          </div>
        </Panel>

        <Panel
          title="Sync external media"
          description="Fetch a title by its source ID and add or update it in the cache."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runSync();
            }}
            className="space-y-3"
          >
            <label className="block">
              <span className={labelClass}>Media type</span>
              <select
                value={syncType}
                onChange={(event) => changeSyncType(event.target.value as MediaType)}
                className={cn(selectClass, "mt-1 block w-full")}
              >
                {MEDIA_TYPES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>External source</span>
              <select
                value={syncSource}
                onChange={(event) => setSyncSource(event.target.value)}
                className={cn(selectClass, "mt-1 block w-full")}
              >
                {SOURCES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>External ID</span>
              <input
                value={syncExternalId}
                onChange={(event) => setSyncExternalId(event.target.value)}
                placeholder={
                  syncSource === "tmdb"
                    ? "e.g. 603"
                    : syncSource === "anilist"
                      ? "e.g. 21"
                      : "e.g. 1020"
                }
                className={cn(inputClass, "mt-1")}
              />
            </label>

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={syncBusy || !syncExternalId.trim()}
            >
              {syncBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Database className="size-3.5" />
              )}
              Sync media
            </Button>
          </form>

          <div className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-3">
            <p>
              Sync fetches fresh metadata from the selected source. Existing records are updated;
              new records are inserted.
            </p>
            <p className="mt-2">
              Soft delete hides a record from library and review queries without removing user data.
              Permanent delete is refused while library entries, reviews or custom list items still
              reference the record.
            </p>
          </div>
        </Panel>
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.isDeleted ? "Delete permanently?" : "Remove media?"}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? deleteTarget.isDeleted
                  ? `“${deleteTarget.title}” is already soft-deleted. Permanent deletion cannot be undone.`
                  : `“${deleteTarget.title}” can be hidden with a soft delete, or removed permanently if nothing references it.`
                : "Choose how to remove this record."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-line bg-surface-3/30 px-3 py-2.5 text-[12px] text-ink-2">
            <p>
              Tracked by <span className="font-medium text-foreground">{deleteTarget?.trackedCount ?? 0}</span>{" "}
              library {deleteTarget?.trackedCount === 1 ? "entry" : "entries"}.
            </p>
            <p className="mt-1 text-[11px] text-ink-3">
              External ID {deleteTarget?.externalSource}:{deleteTarget?.externalId}
            </p>
          </div>

          {deleteError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-700 dark:text-red-300">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>

            {deleteTarget && !deleteTarget.isDeleted && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={deleteBusy}
                onClick={() => void remove(false)}
              >
                {deleteBusy && <Loader2 className="size-3.5 animate-spin" />}
                Soft delete
              </Button>
            )}

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteBusy}
              onClick={() => void remove(true)}
            >
              {deleteBusy && <Loader2 className="size-3.5 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
