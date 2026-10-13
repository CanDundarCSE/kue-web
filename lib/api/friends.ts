import { authFetch, readApiError } from "@/lib/api/client";

export type FriendDto = {
  friendshipId: number;
  userId: number;
  username: string;
  kueId?: string | null;
  bio?: string | null;
  friendsSince: string;
};

export type FriendRequestDto = {
  id: number;
  requesterId: number;
  requesterUsername: string;
  requesterKueId?: string | null;
  requesterBio?: string | null;
  addresseeId: number;
  addresseeUsername: string;
  addresseeKueId?: string | null;
  status: string;
  createdAt: string;
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
