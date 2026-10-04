import type { CurrentUser } from "@/lib/current-user";

// Bridges the 401 refresh interceptor (lib/api/client) and the React provider
// (lib/use-current-user): when a lazy rotation succeeds, the refresh payload
// carries the user, so the profile is pushed here instead of firing a
// separate /api/auth/me round-trip. A null emission means the session is dead.
type SessionListener = (user: CurrentUser | null) => void;

const listeners = new Set<SessionListener>();

export function onSessionSync(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionSync(user: CurrentUser | null) {
  for (const listener of listeners) {
    listener(user);
  }
}
