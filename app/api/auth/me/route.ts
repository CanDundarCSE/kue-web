import { cookies } from "next/headers";

import { API_BASE_URL, AUTH_BASE_PATH } from "@/lib/api/backend";

// Sits under /api/auth so the browser sends the refresh token cookie back,
// which is path-scoped to /api/auth by the login/register proxies.
const ME_PATH = "/api/v1/me";
const REFRESH_PATH = `${AUTH_BASE_PATH}/refresh`;
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const ACCESS_COOKIE_PATH = "/";
const REFRESH_COOKIE_PATH = "/api/auth";
const ACCESS_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const NO_STORE = { "Cache-Control": "no-store" } as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// The backend's 404 body for a missing user is { "message": "User not found." }.
// Only that specific message means "the session's user is gone". A stray 404
// from a proxy, a misconfigured route, or a transient deploy must NOT be
// treated as a reason to wipe a still-valid session.
function isUserNotFound(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" && message.toLowerCase() === "user not found.";
}

// 401 is unambiguously "not authenticated". A 404 only counts when the body
// confirms the user no longer exists. Reads the body at most once.
async function isDefinitiveAuthFailure(response: Response): Promise<boolean> {
  if (response.status === 401) return true;
  if (response.status === 404) {
    return isUserNotFound(await response.json().catch(() => null));
  }
  return false;
}

function fetchMe(accessToken: string): Promise<Response> {
  return fetch(`${API_BASE_URL}${ME_PATH}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
}

function refreshTokens(refreshToken: string): Promise<Response> {
  return fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
}

// Clear both cookies using the exact paths they were set with. A delete with
// the default "/" path would not match the refresh token (scoped to /api/auth),
// leaving the stale token in the browser.
function clearSession(cookieStore: Awaited<ReturnType<typeof cookies>>, isSecure: boolean) {
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

export async function GET(request: Request) {
  // Behind a reverse proxy (nginx, Cloudflare, Vercel, ALB) the internal
  // request usually arrives as plain http; the client's real protocol is
  // forwarded in x-forwarded-proto. Honour that before falling back to the
  // raw request URL (which is what matters in local/dev, no proxy).
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isSecure = forwardedProto
    ? forwardedProto === "https"
    : new URL(request.url).protocol === "https:";

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  let meResponse: Response | undefined;
  if (accessToken) {
    meResponse = await fetchMe(accessToken).catch(() => undefined);
  }

  // Computed once per (possibly new) response so the body is never read twice.
  let definitivelyBad = meResponse ? await isDefinitiveAuthFailure(meResponse) : false;

  // We don't have a usable "me" yet: no response, or the token is expired /
  // its user is gone. In that case try to rotate with the refresh token.
  // (Only one in-flight request reaches here per page load — see the
  // single-flight guard in use-current-user — because the backend revokes ALL
  // sessions if a rotated refresh token is replayed.)
  const needsAuth = !meResponse || definitivelyBad;

  if (needsAuth) {
    if (!refreshToken) {
      return Response.json({ message: "Not signed in." }, { status: 401, headers: NO_STORE });
    }

    let refreshed: Response | undefined;
    try {
      refreshed = await refreshTokens(refreshToken);
    } catch {
      return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
    }

    if (!refreshed.ok) {
      clearSession(cookieStore, isSecure);
      return Response.json(
        { message: "Session expired. Please sign in again." },
        { status: 401, headers: NO_STORE },
      );
    }

    const body: Record<string, unknown> = await refreshed.json().catch(() => ({}));
    const nextAccess = isNonEmptyString(body.accessToken) ? body.accessToken : "";
    const nextRefresh = isNonEmptyString(body.refreshToken) ? body.refreshToken : null;

    if (!nextAccess) {
      return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
    }

    cookieStore.set(ACCESS_COOKIE, nextAccess, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: ACCESS_COOKIE_PATH,
      maxAge: ACCESS_MAX_AGE_SECONDS,
    });
    if (nextRefresh) {
      cookieStore.set(REFRESH_COOKIE, nextRefresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: REFRESH_COOKIE_PATH,
        maxAge: REFRESH_MAX_AGE_SECONDS,
      });
    }

    meResponse = await fetchMe(nextAccess).catch(() => undefined);
    definitivelyBad = meResponse ? await isDefinitiveAuthFailure(meResponse) : false;
  }

  if (!meResponse) {
    return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
  }

  if (definitivelyBad) {
    clearSession(cookieStore, isSecure);
    return Response.json(
      { message: "Session expired. Please sign in again." },
      { status: 401, headers: NO_STORE },
    );
  }

  // Any other non-2xx (stray 404, 5xx, ...): report a 502 but leave the
  // session intact so a transient backend hiccup doesn't log the user out.
  if (!meResponse.ok) {
    return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
  }

  const user = await meResponse.json();
  return Response.json(user, { headers: NO_STORE });
}
