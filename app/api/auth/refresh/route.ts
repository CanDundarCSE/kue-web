import { cookies } from "next/headers";

import {
  NO_STORE,
  REFRESH_COOKIE,
  clearSession,
  isSecureFromRequest,
  rotateWithLock,
  writeAccessToken,
  writeTokens,
} from "@/lib/api/auth";

// On-demand rotation endpoint. The browser only ever calls this reactively —
// when a request 401s (see authFetch in lib/api/client) — never on a timer.
//
// Shares the in-process single-flight lock with /api/auth/me, so parallel
// requests carrying the same refresh token (a page-load race, two tabs
// reloading at once) produce ONE backend /refresh call instead of a replay.
export async function POST(request: Request) {
  const isSecure = isSecureFromRequest(request);
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return Response.json({ message: "Not signed in." }, { status: 401, headers: NO_STORE });
  }

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

  // The populated user from the refresh payload: callers sync the profile
  // from here instead of firing a separate /api/v1/me request.
  return Response.json(outcome.user, { headers: NO_STORE });
}
