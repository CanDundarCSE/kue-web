import { authFetch, readApiError } from "@/lib/api/client";

export type FriendDto = {
  friendshipId: number;
  userId: number;
  username: string;
  kueId?: string | null;
  bio?: string | null;
  avatarId?: string | null;
  friendsSince: string;
};

export type FriendRequestDto = {
  id: number;
  requesterId: number;
  requesterUsername: string;
  requesterKueId?: string | null;
  requesterBio?: string | null;
  requesterAvatarId?: string | null;
  addresseeId: number;
  addresseeUsername: string;
  addresseeKueId?: string | null;
  addresseeAvatarId?: string | null;
  status: string;
  createdAt: string;
};

export type PublicProfileCounts = {
  totalLibraryItems: number;
  completedItems: number;
  inProgressItems: number;
  planningItems: number;
  onHoldItems: number;
  droppedItems: number;
  favoritesCount: number;
  listsCount: number;
  ratingsCount: number;
};

export type PublicProfileDto = {
  id: number;
  username: string;
  kueId?: string | null;
  bio?: string | null;
  avatarId?: string | null;
  isPrivate: boolean;
  isFriend: boolean;
  friendshipStatus: string;
  joinedAt: string;
  counts?: PublicProfileCounts | null;
};

export type FriendActivityDto = {
  id: number;
  userId: number;
  username: string;
  kueId?: string | null;
  avatarId?: string | null;
  bio?: string | null;
  userInitial: string;
  activityType: string;
  action: string;
  detailText?: string | null;
  formattedText: string;
  timeAgo: string;
  formattedDate: string;
  createdAt: string;
  mediaId?: number | null;
  mediaTitle?: string | null;
  mediaType?: string | null;
  mediaCoverImage?: string | null;
  customListId?: number | null;
  customListName?: string | null;
  itemCount?: number | null;
  status?: string | null;
  progress?: number | null;
  rating?: number | null;
  formattedRating?: string | null;
};

async function getJson<T>(path: string): Promise<T | null> {
  const response = await authFetch(path, { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as T | null;
}

export function fetchFriends(): Promise<FriendDto[] | null> {
  return getJson<FriendDto[]>("/api/friends");
}

export function fetchFriendRequests(
  kind: "incoming" | "outgoing",
): Promise<FriendRequestDto[] | null> {
  return getJson<FriendRequestDto[]>(`/api/friends/requests?kind=${kind}`);
}

export function lookupByKueId(kueId: string): Promise<PublicProfileDto | null> {
  return getJson<PublicProfileDto>(`/api/users/by-kueid?kueId=${encodeURIComponent(kueId.trim())}`);
}

export function isKueId(value: string): boolean {
  // Prefix required: a bare alphanumeric string could be a username.
  return /^kue-[a-z0-9]+$/i.test(value.trim());
}

// Stable profile links: Kue IDs survive username changes, usernames keep
// working for old links and manual URL entry.
export function profileHref(user: { username: string; kueId?: string | null }): string {
  const stable = user.kueId?.trim() ? user.kueId.trim() : user.username.trim();
  return `/profile/${encodeURIComponent(stable)}`;
}

export async function fetchPublicProfile(
  id: string,
): Promise<{ profile: PublicProfileDto | null; error: string | null }> {
  const trimmed = id.trim();
  // A "kue-..." slug could theoretically be a username, so fall back to the
  // other lookup when the first one 404s.
  const paths = isKueId(trimmed)
    ? [
        `/api/users/by-kueid?kueId=${encodeURIComponent(trimmed)}`,
        `/api/users/${encodeURIComponent(trimmed)}`,
      ]
    : [`/api/users/${encodeURIComponent(trimmed)}`];
  let lastError: string | null = null;
  for (const path of paths) {
    const response = await authFetch(path, { cache: "no-store" }).catch(() => null);
    if (!response) return { profile: null, error: "Couldn't reach the server." };
    if (response.ok) {
      return { profile: (await response.json().catch(() => null)) as PublicProfileDto | null, error: null };
    }
    lastError = await readApiError(response, "Couldn't load this profile.");
    if (response.status !== 404) break;
  }
  return { profile: null, error: lastError ?? "Couldn't load this profile." };
}

export function fetchUserLists(username: string): Promise<{ items: { id: number; name: string; description?: string | null; isPublic: boolean; visibility?: string; itemCount: number; previewCoverImages?: string[] }[] } | null> {
  return getJson(`/api/users/${encodeURIComponent(username.trim())}/lists`);
}

export function fetchUserActivity(
  username: string,
  days = 30,
): Promise<{ dailySummaries?: { date: string; added: number; completed: number; total?: number }[] } | null> {
  return getJson(`/api/users/${encodeURIComponent(username.trim())}/activity?days=${days}`);
}

export function fetchUserFriends(username: string): Promise<FriendDto[] | null> {
  return getJson<FriendDto[]>(`/api/users/${encodeURIComponent(username.trim())}/friends`);
}

export type UserLibraryEntry = {
  mediaId: number;
  isFavorite: boolean;
  media?: {
    title?: string;
    mediaType?: string;
    coverImage?: string | null;
    year?: number | null;
  } | null;
};

export function fetchUserLibrary(
  username: string,
): Promise<{ items?: UserLibraryEntry[] } | null> {
  return getJson(`/api/users/${encodeURIComponent(username.trim())}/library`);
}

export function fetchFriendsActivity(page = 1, pageSize = 20): Promise<FriendActivityDto[] | null> {
  return getJson<FriendActivityDto[]>(`/api/friends/activity?page=${page}&pageSize=${pageSize}`);
}

export async function sendFriendRequest(
  kueId: string,
): Promise<{ ok: boolean; message: string }> {
  const response = await authFetch("/api/friends/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kueId: kueId.trim() }),
  }).catch(() => null);

  if (!response) return { ok: false, message: "Couldn't reach the server." };
  return { ok: response.ok, message: await readApiError(response, "Couldn't send the request.") };
}

export async function sendFriendRequestByUsername(
  username: string,
): Promise<{ ok: boolean; message: string }> {
  const response = await authFetch("/api/friends/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.trim() }),
  }).catch(() => null);

  if (!response) return { ok: false, message: "Couldn't reach the server." };
  return { ok: response.ok, message: await readApiError(response, "Couldn't send the request.") };
}

export async function respondToRequest(
  requestId: number,
  action: "accept" | "decline",
): Promise<string | null> {
  const response = await authFetch(`/api/friends/requests/${requestId}/${action}`, {
    method: "POST",
  }).catch(() => null);

  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;
  return readApiError(response, `Couldn't ${action} the request.`);
}

export async function removeFriend(username: string): Promise<string | null> {
  const response = await authFetch(`/api/friends/${encodeURIComponent(username)}`, {
    method: "DELETE",
  }).catch(() => null);

  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;
  return readApiError(response, "Couldn't remove.");
}
