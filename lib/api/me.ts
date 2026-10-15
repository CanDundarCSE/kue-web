import { authFetch, readApiError } from "@/lib/api/client";
import { isCurrentUser, type CurrentUser } from "@/lib/current-user";
import { emitSessionSync } from "@/lib/session-sync";

// The profile is mutable from the client (PUT /api/v1/me), so the updated
// user is pushed through the same session-sync channel the 401 interceptor
// uses: the provider picks it up without a separate /api/auth/me round-trip.
export async function updateMe(payload: {
  username?: string;
  email?: string;
  bio?: string | null;
  isPrivate?: boolean;
  // null/omitted = leave unchanged; "" = clear the avatar (back to initials).
  avatarId?: string | null;
}): Promise<CurrentUser | null> {
  const response = await authFetch("/api/v1/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to update profile"));
  }

  const data: unknown = await response.json().catch(() => null);
  if (!isCurrentUser(data)) return null;

  emitSessionSync(data);
  return data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<string | null> {
  const response = await authFetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  }).catch(() => null);

  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;

  return readApiError(response, "Couldn't change the password.");
}

// Right to be forgotten. The BFF route deletes the account on the backend and
// clears the session cookies on a 204. Returns null on success, or a message.
export async function deleteAccount(): Promise<string | null> {
  const response = await authFetch("/api/v1/me", {
    method: "DELETE",
    cache: "no-store",
  }).catch(() => null);

  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;

  return readApiError(response, "Couldn't delete your account.");
}