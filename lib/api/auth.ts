import { cookies } from "next/headers";

import { API_BASE_URL, AUTH_BASE_PATH } from "@/lib/api/backend";

// Single source of truth for the token cookie pair and the rotation logic.
// Both /api/auth/me and /api/auth/refresh go through these so the refresh
// behaviour (and the cookie paths used to clear the pair) never diverges.
export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

export const ACCESS_COOKIE_PATH = "/";
export const REFRESH_COOKIE_PATH = "/api/auth";
export const ACCESS_MAX_AGE_SECONDS = 15 * 60;
export const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const NO_STORE = { "Cache-Control": "no-store" } as const;

export type CookieStore = Awaited<ReturnType<typeof cookies>>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// Behind a reverse proxy (nginx, Cloudflare, Vercel, ALB) the internal request
// usually arrives as plain http; the client's real protocol is forwarded in
// x-forwarded-proto. Honour that before falling back to the raw request URL
// (which is what matters in local/dev, no proxy).
export function isSecureFromRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProto ? forwardedProto === "https" : new URL(request.url).protocol === "https:";
}

// Clear both cookies using the exact paths they were set with. A delete with
// the default "/" path would not match the refresh token (scoped to /api/auth),
// leaving the stale token in the browser.
export function clearSession(cookieStore: CookieStore, isSecure: boolean) {
  cookieStore.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: ACCESS_COOKIE_PATH,
    maxAge: 0,
  });
  cookieStore.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });
}

export function writeAccessToken(
  cookieStore: CookieStore,
  accessToken: string,
  isSecure: boolean,
) {
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: ACCESS_COOKIE_PATH,
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
}

export function writeTokens(
  cookieStore: CookieStore,
  accessToken: string,
  refreshToken: string | null,
  isSecure: boolean,
) {
  writeAccessToken(cookieStore, accessToken, isSecure);
  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }
}

// The backend's 404 body for a missing user is { "message": "User not found." }.
// Only that specific message means "the session's user is gone". A stray 404
// from a proxy, a misconfigured route, or a transient deploy must NOT be
// treated as a reason to wipe a still-valid session.
export function isUserNotFound(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" && message.toLowerCase() === "user not found.";
}

// 401 is unambiguously "not authenticated". A 404 only counts when the body
// confirms the user no longer exists. Reads the body at most once.
export async function isDefinitiveAuthFailure(response: Response): Promise<boolean> {
  if (response.status === 401) return true;
  if (response.status === 404) {
    return isUserNotFound(await response.json().catch(() => null));
  }
  return false;
}

export function fetchMe(accessToken: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/v1/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
}

export function refreshTokens(refreshToken: string): Promise<Response> {
  return fetch(`${API_BASE_URL}${AUTH_BASE_PATH}/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
}

export type RotationOutcome =
  | { ok: true; accessToken: string; refreshToken: string | null; user: unknown }
  | { ok: false; status: 401 | 502; message: string };

const inFlightRotations = new Map<string, Promise<RotationOutcome>>();

// In-process single-flight rotation, keyed by the refresh token. The browser
// shares one refresh cookie across every tab, so parallel requests carrying
// the same token — /api/auth/me and /api/auth/refresh racing on a page load,
// or two tabs reloading at the same moment — must share ONE backend /refresh
// call. Firing two would replay a rotated token, and the backend treats that
// as theft and revokes ALL of the user's sessions. Waiters adopt the winner's
// outcome and write the same fresh pair to their own response cookies.
export function rotateWithLock(refreshToken: string): Promise<RotationOutcome> {
  let inFlight = inFlightRotations.get(refreshToken);

  if (!inFlight) {
    inFlight = (async (): Promise<RotationOutcome> => {
      let refreshed: Response;
      try {
        refreshed = await refreshTokens(refreshToken);
      } catch {
        return { ok: false, status: 502, message: "Cannot reach the Kue API." };
      }

      if (!refreshed.ok) {
        return {
          ok: false,
          status: 401,
          message: "Session expired. Please sign in again.",
        };
      }

      const body: Record<string, unknown> | null = await refreshed.json().catch(() => null);
      const accessToken =
        body && isNonEmptyString(body.accessToken) ? body.accessToken : null;

      if (!body || !accessToken) {
        return { ok: false, status: 502, message: "Cannot reach the Kue API." };
      }

      // A null refreshToken in the response is honored by the callers: the
      // existing refresh cookie is preserved, only the access token rewrites.
      return {
        ok: true,
        accessToken,
        refreshToken: isNonEmptyString(body.refreshToken) ? body.refreshToken : null,
        user: body.user ?? null,
      };
    })().finally(() => {
      inFlightRotations.delete(refreshToken);
    });

    inFlightRotations.set(refreshToken, inFlight);
  }

  return inFlight;
}
