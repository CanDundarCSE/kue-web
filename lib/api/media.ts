import { authFetch } from "@/lib/api/client";
import type { LibraryEntryDto } from "@/lib/api/library";

export type MediaDto = {
  id: number;
  mediaType: string; // "movie", "series", "anime", "manga", "game"
  externalSource: string; // "tmdb", "anilist", "igdb"
  externalId: string;
  title: string;
  originalTitle?: string | null;
  description?: string | null;
  coverImage?: string | null;
  bannerImage?: string | null;
  year?: number | null;
  score?: number | null;
  status?: string | null;
  genres?: string[];
  totalUnits?: number | null;
  unitName?: string | null;
  totalSeasons?: number | null;
  totalVolumes?: number | null;
  runtimeMinutes?: number | null;
  platforms?: string[] | null;
  developer?: string | null;
};

export async function fetchMediaDetails(id: number): Promise<MediaDto | null> {
  const response = await fetch(`/api/media/${id}`, { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as MediaDto | null;
}

export async function fetchExternalMedia(
  source: string,
  id: string,
  type: string
): Promise<MediaDto | null> {
  const url = new URL("/api/media/external", window.location.origin);
  url.searchParams.set("source", source);
  url.searchParams.set("id", id);
  url.searchParams.set("type", type);

  const response = await fetch(url.toString(), { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as MediaDto | null;
}

export type FetchSimilarOptions = {
  id?: number | null;
  externalSource?: string | null;
  externalId?: string | null;
  type?: string | null;
  genres?: string[] | null;
  genre?: string | null;
  pageSize?: number;
};

export async function fetchSimilarMedia(
  paramsOrId?: number | null | FetchSimilarOptions,
  legacyType?: string | null,
  legacyGenre?: string | null
): Promise<MediaDto[]> {
  let endpoint = "";
  if (typeof paramsOrId === "object" && paramsOrId !== null) {
    const { id, externalSource, externalId, type, genres, genre, pageSize = 12 } = paramsOrId;
    if (id && id > 0) {
      endpoint = `/api/media/${id}/similar?pageSize=${pageSize}`;
    } else {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (externalSource) params.set("source", externalSource);
      if (externalId) params.set("id", externalId);
      if (genres && genres.length > 0) {
        params.set("genres", genres.join(","));
      } else if (genre) {
        params.set("genre", genre);
      }
      params.set("pageSize", String(pageSize));
      endpoint = `/api/media/similar?${params.toString()}`;
    }
  } else if (paramsOrId && paramsOrId > 0) {
    endpoint = `/api/media/${paramsOrId}/similar?pageSize=12`;
  } else {
    const params = new URLSearchParams();
    if (legacyType) params.set("type", legacyType);
    if (legacyGenre) params.set("genre", legacyGenre);
    params.set("pageSize", "12");
    endpoint = `/api/media/similar?${params.toString()}`;
  }

  const response = await fetch(endpoint, { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return [];
  const data = (await response.json().catch(() => null)) as { items?: MediaDto[] } | null;
  return Array.isArray(data?.items) ? data.items : [];
}

export async function fetchMediaLibraryEntry(mediaId: number): Promise<LibraryEntryDto | null> {
  const response = await authFetch(`/api/library/${mediaId}`, { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as LibraryEntryDto | null;
}

export async function saveMediaLibraryStatus(
  mediaId: number,
  status: string,
  extra?: { progress?: number; rating?: number; isFavorite?: boolean; platform?: string | null },
): Promise<LibraryEntryDto | null> {
  const response = await authFetch(`/api/library/${mediaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, ...extra }),
  }).catch(() => null);

  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as LibraryEntryDto | null;
}

export async function setMediaPlatform(
  mediaId: number,
  platform: string | null,
): Promise<LibraryEntryDto | null> {
  const response = await authFetch(`/api/library/${mediaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform: platform ?? "" }),
  }).catch(() => null);

  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as LibraryEntryDto | null;
}

export async function setMediaFavorite(
  mediaId: number,
  isFavorite: boolean,
): Promise<LibraryEntryDto | null> {
  const response = await authFetch(`/api/library/${mediaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  }).catch(() => null);

  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as LibraryEntryDto | null;
}

export async function setMediaProgress(mediaId: number, progress: number): Promise<boolean> {
  const response = await authFetch(`/api/library/${mediaId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress }),
  }).catch(() => null);

  return !!response && response.ok;
}

export async function setMediaRating(mediaId: number, rating: number): Promise<boolean> {
  const isDelete = rating <= 0;
  const response = await authFetch(`/api/ratings/${mediaId}`, {
    method: isDelete ? "DELETE" : "PUT",
    headers: isDelete ? undefined : { "Content-Type": "application/json" },
    body: isDelete ? undefined : JSON.stringify({ rating }),
  }).catch(() => null);

  return !!response && response.ok;
}

export async function addMediaToLibrary(payload: {
  mediaId?: number;
  mediaType: string;
  externalSource?: string | null;
  externalId?: string | null;
  status: string;
  title?: string;
  coverImage?: string | null;
  year?: number | null;
  score?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  runtimeMinutes?: number | null;
  platforms?: string[] | null;
  platform?: string | null;
  progress?: number;
  rating?: number;
  isFavorite?: boolean;
}): Promise<LibraryEntryDto | null> {
  const response = await authFetch("/api/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as LibraryEntryDto | null;
}

