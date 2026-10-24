import { isCurrentUser, type CurrentUser } from "@/lib/current-user";

// Shared session probe used by the auth-page gate and the landing nav.
//
// `/api/auth/me` is the single source of truth: it validates the access token
// and, when it has lapsed, rotates the pair server-side through the refresh
// cookie. It is fetched directly (never through `authFetch`) because its 401
// interceptor would fire a second, redundant refresh + logout cycle.
export type SessionProbe =
  | { state: "authenticated"; user: CurrentUser }
  // A definitive 401: the backend rejected the access token and the refresh
  // token is missing, expired or revoked. Safe to show the signed-out UI.
  | { state: "unauthenticated" }
  // Network error, timeout, abort, 5xx or a malformed payload. NOT proof that
  // the session is dead: callers must fail open and leave cookies alone.
  | { state: "unavailable" };

export const SESSION_PROBE_TIMEOUT_MS = 4000;

// Reuse the lock name from `refreshSession` (lib/api/client) so a probe and a
// reactive token refresh can never race each other across tabs. The backend has
// its own rotation grace period, but serializing here avoids spending it.
const SESSION_LOCK_NAME = "kue:auth-refresh";

type ProbeOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function probeSession(options: ProbeOptions = {}): Promise<SessionProbe> {
  const { signal, timeoutMs = SESSION_PROBE_TIMEOUT_MS } = options;

  // Server-side render / already-cancelled caller: never touch the network.
  if (typeof window === "undefined" || signal?.aborted) {
    return { state: "unavailable" };
  }

  // One combined cancellation source: the caller's unmount signal and the
  // timeout both abort the fetch AND a pending Web Lock acquisition, so a
  // held lock can never leave this promise pending past the deadline.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  const run = async (): Promise<SessionProbe> => {
    if (controller.signal.aborted) return { state: "unavailable" };

    const response = await fetch("/api/auth/me", {
      cache: "no-store",
      signal: controller.signal,
    });

    // Only 401 is unambiguous. 502 ("API unreachable") and anything else is
    // transient: report unavailable so the caller shows the form without
    // treating the user as signed out.
    if (response.status === 401) return { state: "unauthenticated" };
    if (!response.ok) return { state: "unavailable" };

    const data: unknown = await response.json().catch(() => null);
    return isCurrentUser(data)
      ? { state: "authenticated", user: data }
      : { state: "unavailable" };
  };

  // Belt-and-braces deadline: even a lock implementation that ignored the
  // abort signal can never keep this promise pending past the timeout. A lock
  // granted after this fires re-checks the signal above and skips the fetch.
  const aborted = new Promise<SessionProbe>((resolve) => {
    controller.signal.addEventListener(
      "abort",
      () => resolve({ state: "unavailable" }),
      { once: true },
    );
  });

  try {
    const request = (async (): Promise<SessionProbe> => {
      if (typeof navigator !== "undefined" && "locks" in navigator) {
        return await navigator.locks.request(
          SESSION_LOCK_NAME,
          { signal: controller.signal },
          run,
        );
      }
      return await run();
    })();

    return await Promise.race([request, aborted]);
  } catch {
    // AbortError from the timeout/unmount, a rejected lock request, or a
    // network failure. All of these are "we don't know", never "signed out".
    return { state: "unavailable" };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
