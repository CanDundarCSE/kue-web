"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { redirectToSignIn } from "@/lib/api/client";
import { probeSession, type SessionProbe } from "@/lib/api/session";
import type { CurrentUser } from "@/lib/current-user";
import { onSessionSync } from "@/lib/session-sync";

// "unavailable" means the probe could not determine the session (network
// failure, timeout, 5xx). It is NOT a sign-out: the UI shows a retry screen and
// the cookies stay untouched.
export type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable";

type CurrentUserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  status: SessionStatus;
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  user: null,
  loading: true,
  status: "loading",
});

// Last validated user, kept across provider mounts so client-side navigation
// between sections (each has its own layout) does not flash the auth loader.
// Only ever read/written in the browser: on the server this module could be
// shared by concurrent requests, and caching a user there would leak profiles
// between visitors.
let cachedUser: CurrentUser | null = null;

// Bumped whenever the cache is invalidated (logout, 401). A probe that started
// before the invalidation must not repopulate the cache when it lands late.
let cacheEpoch = 0;

function readCachedUser(): CurrentUser | null {
  return typeof window === "undefined" ? null : cachedUser;
}

function writeCachedUser(user: CurrentUser | null) {
  if (typeof window !== "undefined") cachedUser = user;
}

export function clearCurrentUserCache() {
  cacheEpoch += 1;
  writeCachedUser(null);
}

// Single-flight: while a probe is in flight, concurrent callers (a
// double-mounted provider under React StrictMode, or two providers overlapping
// during a route transition) share the same result instead of firing twice.
let inFlight: Promise<SessionProbe> | null = null;

function fetchSessionOnce(): Promise<SessionProbe> {
  if (!inFlight) {
    inFlight = probeSession().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

// No background timers: the 15-minute access token is renewed on demand.
// /api/auth/me rotates it lazily on a page load or navigation, and any API
// 401 triggers the reactive refresh in lib/api/client, which retries the
// original request. If the refresh token itself is dead, the refresh route
// clears the cookies and the interceptor redirects to /login.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => readCachedUser());
  const [status, setStatus] = useState<SessionStatus>(() =>
    readCachedUser() ? "authenticated" : "loading",
  );

  // Initial load: resolve the session exactly once. A cached user paints the
  // shell immediately, but the probe still runs and a 401 wins over the cache.
  useEffect(() => {
    let cancelled = false;
    const epoch = cacheEpoch;

    fetchSessionOnce().then((result) => {
      if (cancelled || epoch !== cacheEpoch) return;

      if (result.state === "authenticated") {
        writeCachedUser(result.user);
        setUser(result.user);
        setStatus("authenticated");
        return;
      }

      if (result.state === "unauthenticated") {
        // Definitive 401: the route already cleared the cookies it could not
        // use. Drop the cache so a later mount cannot resurrect the session.
        clearCurrentUserCache();
        setUser(null);
        setStatus("unauthenticated");
        redirectToSignIn();
        return;
      }

      // Transient failure. Never log out over it: keep a session that was
      // already validated in this page load, otherwise offer a retry.
      const cached = readCachedUser();
      if (cached) {
        setUser(cached);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unavailable");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // A lazy rotation that succeeds elsewhere (the 401 interceptor) carries the
  // user in its payload: pick it up here without a separate /api/auth/me
  // round-trip. A null emission means the session is dead.
  useEffect(
    () =>
      onSessionSync((synced) => {
        if (synced) {
          writeCachedUser(synced);
          setUser(synced);
          setStatus("authenticated");
          return;
        }

        clearCurrentUserCache();
        setUser(null);
        setStatus("unauthenticated");
      }),
    [],
  );

  const value = useMemo(
    () => ({ user, loading: status === "loading", status }),
    [user, status],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
