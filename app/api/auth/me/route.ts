import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  NO_STORE,
  clearSession,
  fetchMe,
  isDefinitiveAuthFailure,
  isSecureFromRequest,
  rotateSession,
} from "@/lib/api/auth";

// Sits under /api/auth so the browser sends the refresh token cookie back,
// which is path-scoped to /api/auth by the login/register proxies.
export async function GET(request: Request) {
  const isSecure = isSecureFromRequest(request);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  let meResponse: Response | undefined;
  if (accessToken) {
    meResponse = await fetchMe(accessToken).catch(() => undefined);
  }

  // Computed once per (possibly new) response so the body is never read twice.
  let definitivelyBad = meResponse ? await isDefinitiveAuthFailure(meResponse) : false;

  // We don't have a usable "me" yet: no response, or the token is expired /
  // its user is gone. In that case rotate with the refresh token.
  // (Only one in-flight request reaches here per page load — see the
  // single-flight guard in use-current-user — because the backend revokes ALL
  // sessions if a rotated refresh token is replayed.)
  const needsAuth = !meResponse || definitivelyBad;

  if (needsAuth) {
    const rotated = await rotateSession(cookieStore, isSecure);
    if (!rotated.ok) {
      return Response.json({ message: rotated.message }, { status: rotated.status, headers: NO_STORE });
    }

    meResponse = await fetchMe(rotated.accessToken).catch(() => undefined);
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
