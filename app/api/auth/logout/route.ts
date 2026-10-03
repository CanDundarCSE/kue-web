import { cookies } from "next/headers";

import { API_BASE_URL, AUTH_BASE_PATH } from "@/lib/api/backend";
import { NO_STORE, REFRESH_COOKIE, clearSession, isSecureFromRequest } from "@/lib/api/auth";

// Server-side logout: ask the Kue API to revoke the refresh token so a stolen
// refresh cookie stops working on the backend too, then always clear the web
// cookies so the user is signed out locally even if the backend is unreachable.
export async function POST(request: Request) {
  const isSecure = isSecureFromRequest(request);
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}${AUTH_BASE_PATH}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Backend unreachable: fall through and clear the cookies anyway.
    }
  }

  clearSession(cookieStore, isSecure);
  return Response.json({ message: "Logged out successfully." }, { headers: NO_STORE });
}
