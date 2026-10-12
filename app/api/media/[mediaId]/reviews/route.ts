import { cookies } from "next/headers";

import { API_BASE_URL } from "@/lib/api/backend";
import { ACCESS_COOKIE, NO_STORE } from "@/lib/api/auth";
import { fetchProtected } from "@/lib/api/protected";

const SORTS = new Set(["newest", "oldest", "highest", "lowest"]);

// Public review feed for one media title. Signed-in readers go through the
// authenticated proxy so they also see their own private review; anonymous
// readers hit the backend directly since there is no token to forward.
export async function GET(
  request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  const id = Number(mediaId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid media ID." }, { status: 400, headers: NO_STORE });
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  if (searchParams.get("page")) params.set("page", searchParams.get("page")!);
  if (searchParams.get("pageSize")) params.set("pageSize", searchParams.get("pageSize")!);
  const sort = searchParams.get("sort")?.trim().toLowerCase();
  if (sort && SORTS.has(sort)) params.set("sort", sort);
  if (searchParams.get("hideSpoilers") === "true") params.set("hideSpoilers", "true");
  const qs = params.toString();

  const cookieStore = await cookies();
  if (cookieStore.get(ACCESS_COOKIE)?.value) {
    return fetchProtected(`/media/${id}/reviews${qs ? `?${qs}` : ""}`);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/api/v1/media/${id}/reviews${qs ? `?${qs}` : ""}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "Cannot reach the Kue API." }, { status: 502, headers: NO_STORE });
  }

  const payload = await upstream.json().catch(() => null);
  return Response.json(
    payload ?? { message: "Cannot reach the Kue API." },
    { status: upstream.status, headers: NO_STORE },
  );
}
