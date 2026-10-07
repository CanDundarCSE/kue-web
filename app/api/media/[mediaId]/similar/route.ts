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
    const response = await fetch(`${API_BASE_URL}/api/v1/media/${id}/similar?pageSize=8`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const data = await response.json().catch(() => null);
    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      return Response.json(data, {
        status: response.status,
        headers: NO_STORE,
      });
    }

    // Fallback: If local database has no similar items, fetch media details to know type & genre, then fetch external similar/trending
    const mediaDetailsRes = await fetch(`${API_BASE_URL}/api/v1/media/${id}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).catch(() => null);

    if (mediaDetailsRes && mediaDetailsRes.ok) {
      const media = await mediaDetailsRes.json().catch(() => null);
      if (media?.mediaType) {
        const params = new URLSearchParams();
        params.set("type", media.mediaType);
        if (media.genres?.[0]) params.set("genre", media.genres[0]);
        params.set("pageSize", "8");

        const fallbackRes = await fetch(`${API_BASE_URL}/api/v1/media/similar?${params.toString()}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          const fallbackData = await fallbackRes.json().catch(() => null);
          if (fallbackData?.items && Array.isArray(fallbackData.items) && fallbackData.items.length > 0) {
            const filtered = fallbackData.items.filter((item: { id?: number; externalId?: string }) => 
              item.id !== id && (!media.externalId || item.externalId !== media.externalId)
            );
            return Response.json({ ...fallbackData, items: filtered }, {
              status: 200,
              headers: NO_STORE,
            });
          }
        }
      }
    }

    return Response.json(data ?? { items: [] }, {
      status: response.status,
      headers: NO_STORE,
    });
  } catch {
    return Response.json({ items: [] }, { status: 502, headers: NO_STORE });
  }
}

