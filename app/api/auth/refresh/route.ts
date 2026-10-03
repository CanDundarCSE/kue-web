import { cookies } from "next/headers";

import { NO_STORE, isSecureFromRequest, rotateSession } from "@/lib/api/auth";

// First-class refresh endpoint. Rotates the refresh-token pair and rewrites both
// cookies so the session survives after the short-lived access token lapses.
//
// Kept separate from /api/auth/me so any protected proxy route can call the same
// rotation without dragging the profile lookup along with it. The browser's
// keep-alive deliberately does NOT call this endpoint directly (see
// use-current-user): it re-syncs through /api/auth/me instead, so there is a
// single rotation path in the browser and the backend can never see two
// rotations in flight (a replayed rotated token revokes ALL sessions).
export async function POST(request: Request) {
  const isSecure = isSecureFromRequest(request);
  const cookieStore = await cookies();

  const rotated = await rotateSession(cookieStore, isSecure);
  if (!rotated.ok) {
    return Response.json({ message: rotated.message }, { status: rotated.status, headers: NO_STORE });
  }

  return Response.json({ message: "Session refreshed." }, { headers: NO_STORE });
}
