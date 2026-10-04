import { cookies } from "next/headers";

import { API_BASE_URL } from "@/lib/api/backend";
import { ACCESS_COOKIE, NO_STORE } from "@/lib/api/auth";

type ProtectedInit = {
  method?: "GET" | "POST";
  body?: string;
};

// Proxies one request to a protected backend endpoint using the access token
// cookie. A lapsed token surfaces as a 401; the client interceptor
// (lib/api/client) triggers the single-flight lazy refresh and retries.
export async function fetchProtected(path: string, init: ProtectedInit = {}): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return Response.json({ message: "Not signed in." }, { status: 401, headers: NO_STORE });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body,
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
  }

  // Non-JSON bodies (proxy error pages, gateway 5xx...) surface with the
  // original status and a stable message the client can display.
  const payload = await upstream.json().catch(() => null);

  return Response.json(
    payload ?? { message: "Cannot reach the Kue API." },
    { status: upstream.status, headers: NO_STORE },
  );
}
