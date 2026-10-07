import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const source = searchParams.get("source") || searchParams.get("externalSource");
  const id = searchParams.get("id") || searchParams.get("externalId");
  const genre = searchParams.get("genre");
  const genres = searchParams.get("genres");
  const pageSize = searchParams.get("pageSize") || "12";

  const backendUrl = new URL(`${API_BASE_URL}/api/v1/media/similar`);
  if (type) backendUrl.searchParams.set("type", type);
  if (source) backendUrl.searchParams.set("source", source);
  if (id) backendUrl.searchParams.set("id", id);
  if (genres) backendUrl.searchParams.set("genres", genres);
  else if (genre) backendUrl.searchParams.set("genre", genre);
  backendUrl.searchParams.set("pageSize", pageSize);

  try {
    const response = await fetch(backendUrl.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const data = await response.json().catch(() => null);
    return Response.json(data ?? { items: [] }, {
      status: response.status,
      headers: NO_STORE,
    });
  } catch {
    return Response.json({ items: [] }, { status: 502, headers: NO_STORE });
  }
}

