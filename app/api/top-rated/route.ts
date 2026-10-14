import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

type RawItem = {
  id?: number;
  mediaType?: string;
  title?: string;
  year?: number | null;
  score?: number | null;
  coverImage?: string | null;
  description?: string | null;
  externalSource?: string | null;
  externalId?: string | null;
};

const TOP_RATED_TYPES = ["movie", "series", "anime", "manga", "game"] as const;

function isTopRatedType(value: string | null): boolean {
  return value !== null && (TOP_RATED_TYPES as readonly string[]).includes(value);
}

function extractItems(payload: unknown): RawItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as RawItem[];
  const obj = payload as { items?: RawItem[] };
  return Array.isArray(obj.items) ? obj.items : [];
}

async function fetchTopPage(type: string, pageSize: number): Promise<RawItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/media/top?type=${type}&pageSize=${pageSize}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) return [];
    return extractItems(await response.json().catch(() => null));
  } catch {
    return [];
  }
}

// Round-robin across the per-type lists so the mixed rail stays balanced
// instead of clustering one media type at the top.
function interleave<T>(lists: T[][], limit: number): T[] {
  const out: T[] = [];
  for (let i = 0; out.length < limit; i++) {
    let progressed = false;
    for (const list of lists) {
      if (i < list.length && out.length < limit) {
        out.push(list[i]);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(
    20,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  const typeParam = searchParams.get("type");

  // The backend only serves one media type per top call, so an unfiltered
  // request is fanned out across all five types and interleaved.
  if (!isTopRatedType(typeParam)) {
    const perType = await Promise.all(
      TOP_RATED_TYPES.map((type) => fetchTopPage(type, 3)),
    );
    const items = interleave(perType, pageSize);
    return Response.json(
      {
        items,
        page: 1,
        pageSize,
        totalItems: items.length,
        totalPages: 1,
      },
      { headers: NO_STORE },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${API_BASE_URL}/api/v1/media/top?type=${typeParam}&pageSize=${pageSize}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
  } catch {
    return Response.json(
      { message: "Cannot reach the Kue API." },
      { status: 502, headers: NO_STORE },
    );
  }

  const payload = await upstream.json().catch(() => null);
  return Response.json(
    payload ?? { message: "Cannot reach the Kue API." },
    { status: upstream.status, headers: NO_STORE },
  );
}

