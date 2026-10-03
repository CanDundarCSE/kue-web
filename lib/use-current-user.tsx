"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { CurrentUser } from "@/lib/current-user";

type CurrentUserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  user: null,
  loading: true,
});

function isUser(value: unknown): value is CurrentUser {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as CurrentUser).username === "string"
  );
}

// Single-flight: while a request is in flight, any concurrent caller (e.g. a
// double-mounted provider under React StrictMode, or a rapid re-mount) reuses
// the same promise instead of firing a second request. This matters because the
// backend revokes ALL of a user's sessions if a rotated refresh token is
// replayed, so two parallel /api/auth/me calls that both try to refresh would
// otherwise kill the session. The promise is cleared on settle, so a later
// call (e.g. after navigating away and back, or a keep-alive tick) fetches fresh.
let inFlight: Promise<CurrentUser | null> | null = null;

function fetchCurrentUserOnce(): Promise<CurrentUser | null> {
  if (!inFlight) {
    inFlight = fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        const data: unknown = await response.json();
        return isUser(data) ? data : null;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

// The access token cookie lives 15 minutes; /api/auth/me rotates it lazily the
// next time it is called. To keep the user signed in across long idle periods we
// re-sync once the last successful sync is older than this — comfortably under
// the 15-minute token life, so the token is renewed before it lapses rather than
// being hit with a 401 mid-interaction.
const KEEPALIVE_STALE_MS = 10 * 60 * 1000;

// Cheap liveness check between actual re-syncs. The re-sync only fires when the
// session is already past KEEPALIVE_STALE_MS, so this interval itself does no
// wasted work.
const KEEPALIVE_CHECK_MS = 30 * 1000;

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSyncedAt = useRef(0);

  // Initial load: resolve `loading` exactly once and set the user (or null when
  // not signed in). This is the only path that may set user to null.
  useEffect(() => {
    let cancelled = false;

    fetchCurrentUserOnce().then((data) => {
      if (cancelled) return;
      if (data) lastSyncedAt.current = Date.now();
      setUser(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep-alive: while signed in, re-sync through /api/auth/me (the single
  // rotation path in the browser) once the last sync goes stale. A transient
  // null (5xx, brief network blip) is ignored so a hiccup never logs the user
  // out — only a real, settled 401/signed-out state is established by the
  // initial-load path above.
  useEffect(() => {
    if (user === null) return;

    const isStale = () => Date.now() - lastSyncedAt.current >= KEEPALIVE_STALE_MS;

    const resync = () => {
      fetchCurrentUserOnce().then((data) => {
        if (!data) return;
        lastSyncedAt.current = Date.now();
        setUser(data);
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && isStale()) resync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const heartbeat = setInterval(() => {
      if (isStale()) resync();
    }, KEEPALIVE_CHECK_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(heartbeat);
    };
  }, [user]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
