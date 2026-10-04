import { cookies } from "next/headers";

import { API_BASE_URL } from "@/lib/api/backend";
import { ACCESS_COOKIE, NO_STORE } from "@/lib/api/auth";

type UpstreamInit = {
  method: "GET" | "POST";
  body?: string;
};

// Proxies one request to a protected backend endpoint using the access token
// cookie. The refresh token cookie is path-scoped to /api/auth, so rotation
// cannot happen from here — a lapsed access token surfaces as a 401 and the
// client re-syncs through /api/auth/me (the single rotation path) and retries.
async function fetchUpstream(path: string, init: UpstreamInit): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return Response.json({ message: "Not signed in." }, { status: 401, headers: NO_STORE });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { message: "Cannot reach the Kue API." },
      { status: 502, headers: NO_STORE },
    );
  }

  const payload = await upstream.json().catch(() => null);

  // Non-JSON bodies (proxy error pages, gateway 5xx...) surface with the
  // original status and a stable message the client can display.
  return Response.json(
    payload ?? { message: "Cannot reach the Kue API." },
    { status: upstream.status, headers: NO_STORE },
  );
}

export function fetchContinue(): Promise<Response> {
  return fetchUpstream("/me/library/continue", { method: "GET" });
}

export function updateProgress(mediaId: number, progress: number): Promise<Response> {
  return fetchUpstream(`/me/library/${mediaId}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress }),
  });
}
