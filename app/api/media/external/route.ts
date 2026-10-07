import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!source || !id || !type) {
    return Response.json(
      { message: "source, id, and type query parameters are required." },
      { status: 400, headers: NO_STORE }
    );
  }

  const backendUrl = new URL(`${API_BASE_URL}/api/v1/media/external`);
  backendUrl.searchParams.set("source", source);
  backendUrl.searchParams.set("id", id);
  backendUrl.searchParams.set("type", type);

  try {
    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    return Response.json(data ?? { message: "Could not fetch external media." }, {
      status: response.status,
      headers: NO_STORE,
    });
  } catch {
    return Response.json({ message: "Cannot reach backend." }, { status: 502, headers: NO_STORE });
  }
}

