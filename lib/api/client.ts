import { isCurrentUser, type CurrentUser } from "@/lib/current-user";
import { emitSessionSync } from "@/lib/session-sync";

// Rotation paths under /api/auth must never run through the 401 interceptor,
// or a dead session would recurse into itself.
const EXCLUDED_PREFIXES = ["/api/auth/refresh", "/api/auth/logout"];

function isExcluded(path: string) {
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// --- Single-flight lazy refresh -------------------------------------------

let refreshInFlight: Promise<CurrentUser | null> | null = null;
let redirectStarted = false;

function startSignInRedirect() {
  if (redirectStarted || typeof window === "undefined") return;
  redirectStarted = true;
  // A full navigation is deliberate: this fires from a fetch interceptor with
  // no router context, and discarding all client state is the point of a
  // dead-session bounce.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}

async function performRefresh(): Promise<CurrentUser | null> {
  let response: Response;
  try {
    response = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
  } catch {
    // Network failure: not a definitive dead session, so never log out over it.
    return null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      // The refresh token itself is dead (expired or revoked). Wipe local
      // state, let the BFF revoke + clear the cookies server-side, and bounce
      // to sign-in.
      emitSessionSync(null);
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
      startSignInRedirect();
    }
    return null;
  }

  const body: unknown = await response.json().catch(() => null);
  if (!isCurrentUser(body)) return null;

  // The refresh payload carries the user, so sync it directly — no separate
  // /api/auth/me request needed.
  emitSessionSync(body);
  return body;
}

// Single-flight within the tab, and across tabs via the Web Locks API when
// available: a refresh already in flight is awaited, never duplicated.
export function refreshSession(): Promise<CurrentUser | null> {
  if (!refreshInFlight) {
    const run = async () => {
      if (typeof navigator !== "undefined" && "locks" in navigator) {
        return navigator.locks.request("kue:auth-refresh", () => performRefresh());
      }
      return performRefresh();
    };

    refreshInFlight = run()
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

// --- Authenticated fetch with reactive 401 retry ---------------------------

// Fires the request, and on a 401 triggers the single-flight lazy refresh and
// replays the original request exactly once. The replayed request picks up the
// fresh httpOnly access cookie automatically, so no token juggling is needed
// on the client.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let response = await fetch(path, init);

  if (response.status === 401 && !isExcluded(path)) {
    const user = await refreshSession();
    if (user !== null) {
      response = await fetch(path, init);
    }
  }

  return response;
}

// Extracts the user-facing message from a BFF/API error body
// ({ message: string }) and falls back to a generic one when the body is
// missing, not JSON, or carries no message.
export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { message?: unknown }).message === "string" &&
      ((body as { message: string }).message.length > 0)
    ) {
      return (body as { message: string }).message;
    }
  } catch {
    // Non-JSON body: fall through to the fallback message.
  }

  return fallback;
}
