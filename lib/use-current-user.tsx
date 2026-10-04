"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authFetch } from "@/lib/api/client";
import { isCurrentUser, type CurrentUser } from "@/lib/current-user";
import { onSessionSync } from "@/lib/session-sync";

type CurrentUserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  user: null,
  loading: true,
});

// Single-flight: while the initial /api/auth/me request is in flight, any
// concurrent caller (e.g. a double-mounted provider under React StrictMode, or
// a rapid re-mount) reuses the same promise instead of firing a second
// request. The promise is cleared on settle, so a later call fetches fresh.
let inFlight: Promise<CurrentUser | null> | null = null;

function fetchCurrentUserOnce(): Promise<CurrentUser | null> {
  if (!inFlight) {
    inFlight = authFetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const data: unknown = await response.json();
        return isCurrentUser(data) ? data : null;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

// No background timers: the 15-minute access token is renewed on demand.
// /api/auth/me rotates it lazily on a page load or navigation, and any API
// 401 triggers the reactive refresh in lib/api/client, which retries the
// original request. If the refresh token itself is dead, that interceptor
// wipes the cookies and redirects to /login.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load: resolve `loading` exactly once and set the user (or null
  // when not signed in). This is the only path that may set user to null.
  useEffect(() => {
    let cancelled = false;

    fetchCurrentUserOnce().then((data) => {
      if (cancelled) return;
      setUser(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // A lazy rotation that succeeds elsewhere (the 401 interceptor) carries the
  // user in its payload: pick it up here without a separate /api/auth/me
  // round-trip.
  useEffect(
    () =>
      onSessionSync((synced) => {
        if (synced) {
          setUser(synced);
          setLoading(false);
        }
      }),
    [],
  );

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
