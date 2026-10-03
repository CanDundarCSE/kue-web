"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
// mount (e.g. after navigating away and back) fetches fresh.
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

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
