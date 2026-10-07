import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  const id = Number(mediaId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid media ID." }, { status: 400, headers: NO_STORE });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/media/${id}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const data = await response.json().catch(() => null);
    return Response.json(data ?? { message: "Media not found." }, {
      status: response.status,
      headers: NO_STORE,
    });
  } catch {
    return Response.json({ message: "Cannot reach backend." }, { status: 502, headers: NO_STORE });
  }
}

