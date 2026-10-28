"use client";

import { useCallback, useEffect, useState } from "react";

import { authFetch } from "@/lib/api/client";
import type { LibraryEntryDto, PagedResponseDto } from "@/lib/api/library";
import { useCurrentUser } from "@/lib/use-current-user";

export type LibraryPresence = {
  ids: Set<number>;
  externals: Set<string>;
};

// Minimal shape needed for a membership check. Both SearchMedia and MediaDto
// satisfy this.
export type PresenceQueryable = {
  id: number;
  mediaType: string;
  externalSource: string | null;
  externalId: string | null;
};

const EMPTY: LibraryPresence = { ids: new Set(), externals: new Set() };

// Shared per-tab cache so the dropdown and the full search page don't each
// refetch the library. Invalidated whenever an add/remove succeeds.
let cache: { key: string; presence: LibraryPresence } | null = null;
let inflight: { key: string; promise: Promise<LibraryPresence> } | null = null;

export function invalidateLibraryPresence() {
  cache = null;
}

// External matching must include the media type: TMDB ids overlap between
// movies and series, so source:id alone can collide.
export function presenceKeyFor(
  mediaType: string | null | undefined,
  source: string | null | undefined,
  id: string | null | undefined,
): string | null {
  if (!mediaType || !source || !id) return null;
  return `${mediaType.trim().toLowerCase()}|${source.trim().toLowerCase()}|${id.trim()}`;
}

function collectEntry(presence: LibraryPresence, entry: LibraryEntryDto) {
  if (typeof entry.mediaId === "number" && entry.mediaId > 0) {
    presence.ids.add(entry.mediaId);
  }
  const summary = entry.media;
  if (summary && typeof summary.id === "number" && summary.id > 0) {
    presence.ids.add(summary.id);
  }
  const key = presenceKeyFor(
    summary?.mediaType ?? entry.mediaType,
    summary?.externalSource,
    summary?.externalId,
  );
  if (key) presence.externals.add(key);
}

async function fetchPresence(): Promise<LibraryPresence> {
  const presence: LibraryPresence = { ids: new Set(), externals: new Set() };

  let page = 1;
  const pageSize = 100;

  for (;;) {
    const response = await authFetch(`/api/library?page=${page}&pageSize=${pageSize}`, {
      cache: "no-store",
    }).catch(() => null);
    if (!response || !response.ok) break;

    const data = (await response.json().catch(() => null)) as PagedResponseDto<LibraryEntryDto> | null;
    const items = data && Array.isArray(data.items) ? data.items : [];
    for (const entry of items) {
      if (entry && typeof entry === "object") collectEntry(presence, entry);
    }

    const totalPages = typeof data?.totalPages === "number" ? data.totalPages : page;
    if (page >= totalPages || items.length === 0) break;
    page += 1;
    // Safety cap: ~5000 entries. Beyond that the per-id check below still
    // covers whatever the library fetch missed.
    if (page > 50) break;
  }

  return presence;
}

function getPresence(key: string): Promise<LibraryPresence> {
  if (cache && cache.key === key) return Promise.resolve(cache.presence);
  if (!inflight || inflight.key !== key) {
    const promise = fetchPresence().then((presence) => {
      cache = { key, presence };
      return presence;
    });
    inflight = { key, promise };
    void promise
      .catch(() => undefined)
      .finally(() => {
        if (inflight?.promise === promise) inflight = null;
      });
  }
  return inflight.promise;
}

export function isMediaInLibrary(presence: LibraryPresence, media: PresenceQueryable): boolean {
  if (typeof media.id === "number" && media.id > 0 && presence.ids.has(media.id)) {
    return true;
  }
  const key = presenceKeyFor(media.mediaType, media.externalSource, media.externalId);
  return key !== null && presence.externals.has(key);
}

export function useLibraryPresence({ enabled = true }: { enabled?: boolean } = {}) {
  const { user, loading: authLoading } = useCurrentUser();
  const [presence, setPresence] = useState<LibraryPresence>(EMPTY);
  const [loading, setLoading] = useState(false);

  // Deferred like the search surfaces: setState calls must not run
  // synchronously in the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (authLoading || !enabled) return;

    let cancelled = false;
    const handle = setTimeout(() => {
      if (cancelled) return;

      if (!user) {
        setPresence(EMPTY);
        setLoading(false);
        return;
      }

      const key = String(user.id);
      if (cache && cache.key === key) {
        setPresence(cache.presence);
        setLoading(false);
        return;
      }

      setLoading(true);
      getPresence(key).then(
        (next) => {
          if (!cancelled) {
            setPresence(next);
            setLoading(false);
          }
        },
        () => {
          if (!cancelled) setLoading(false);
        },
      );
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [user, authLoading, enabled]);

  const isInLibrary = useCallback(
    (media: PresenceQueryable) => isMediaInLibrary(presence, media),
    [presence],
  );

  return { isInLibrary, loading };
}
