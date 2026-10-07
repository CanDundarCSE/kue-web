import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const genre = searchParams.get("genre");
  const pageSize = searchParams.get("pageSize") || "8";

  const backendUrl = new URL(`${API_BASE_URL}/api/v1/media/similar`);
  if (type) backendUrl.searchParams.set("type", type);
  if (genre) backendUrl.searchParams.set("genre", genre);
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

