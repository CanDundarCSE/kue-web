import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

const MEDIA_TYPES = new Set(["movie", "series", "game", "anime", "manga"]);

// The top-bar dropdown uses the default small page (8 results); the search
// page passes its own page/pageSize for the full result set.
function readBoundedInt(raw: string | null, fallback: number, min: number, max: number) {
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return Response.json({ message: "Query is required." }, { status: 400, headers: NO_STORE });
  }

  const page = readBoundedInt(url.searchParams.get("page"), 1, 1, 10_000);
  const pageSize = readBoundedInt(url.searchParams.get("pageSize"), 8, 1, 50);

  const params = new URLSearchParams({ query, page: String(page), pageSize: String(pageSize) });
  const type = url.searchParams.get("type")?.trim();
  if (type && MEDIA_TYPES.has(type)) params.set("type", type);

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/api/v1/search?${params.toString()}`, {
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
