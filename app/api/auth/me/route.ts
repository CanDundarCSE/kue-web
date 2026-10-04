import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  NO_STORE,
  REFRESH_COOKIE,
  clearSession,
  fetchMe,
  isDefinitiveAuthFailure,
  isSecureFromRequest,
  rotateWithLock,
  writeAccessToken,
  writeTokens,
} from "@/lib/api/auth";
import { isCurrentUser } from "@/lib/current-user";

// Sits under /api/auth so the browser sends the refresh token cookie back,
// which is path-scoped to /api/auth by the login/register proxies.
//
// Pure-lazy rotation: the access token is tried first, and the session is only
// rotated when it is missing, expired, or its user is gone. Transient backend
// failures never rotate or log out.
export async function GET(request: Request) {
  const isSecure = isSecureFromRequest(request);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  let meResponse: Response | undefined;
  if (accessToken) {
    meResponse = await fetchMe(accessToken).catch(() => undefined);
  }

  // Computed once per (possibly new) response so the body is never read twice.
  const definitivelyBad = meResponse ? await isDefinitiveAuthFailure(meResponse) : false;

  // Happy path: the access token still works.
  if (meResponse && meResponse.ok && !definitivelyBad) {
    const user = await meResponse.json();
    return Response.json(user, { headers: NO_STORE });
  }

  // Any other non-2xx (stray 404, 5xx, ...): report a 502 but leave the
  // session intact so a transient backend hiccup doesn't rotate the token or
  // log the user out.
  if (meResponse && !definitivelyBad && !meResponse.ok) {
    return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
  }

  // Lazy rotation: the access token is missing, expired, or its user is gone.
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return Response.json(
      {
        message: definitivelyBad ? "Session expired. Please sign in again." : "Not signed in.",
      },
      { status: 401, headers: NO_STORE },
    );
  }

  // Shares the in-process single-flight lock with /api/auth/refresh, so a
  // concurrent client-side refresh can never replay the same rotated token.
  const outcome = await rotateWithLock(refreshToken);

  if (!outcome.ok) {
    clearSession(cookieStore, isSecure);
    return Response.json({ message: outcome.message }, { status: outcome.status, headers: NO_STORE });
  }

  // Persist the fresh access token. The refresh cookie is replaced only when
  // the backend issued a new one; a null refreshToken leaves the existing
  // cookie untouched, per the backend contract.
  if (outcome.refreshToken) {
    writeTokens(cookieStore, outcome.accessToken, outcome.refreshToken, isSecure);
  } else {
    writeAccessToken(cookieStore, outcome.accessToken, isSecure);
  }

  if (!isCurrentUser(outcome.user)) {
    // The rotation succeeded but the profile payload was malformed: report a
    // 502 without touching the now-valid session.
    return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
  }

  // The refresh payload carries the user, so no second /api/v1/me call.
  return Response.json(outcome.user, { headers: NO_STORE });
}
