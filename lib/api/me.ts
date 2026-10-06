import { authFetch, readApiError } from "@/lib/api/client";
import { isCurrentUser, type CurrentUser } from "@/lib/current-user";
import { emitSessionSync } from "@/lib/session-sync";

// The profile is mutable from the client (PUT /api/v1/me), so the updated
// user is pushed through the same session-sync channel the 401 interceptor
// uses: the provider picks it up without a separate /api/auth/me round-trip.
export async function updateMe(payload: {
  username?: string;
  bio?: string | null;
  isPrivate?: boolean;
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