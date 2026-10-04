import { fetchProtected } from "@/lib/api/protected";

const MEDIA_TYPES = new Set(["movie", "series", "game", "anime", "manga"]);
const STATUSES = new Set(["planning", "in_progress", "completed", "on_hold", "dropped"]);

// Add a title to the signed-in user's library. Search results and the
// "Add title" flow land here; the backend resolves the media by id or
// external source/id and rejects duplicates.
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const mediaType = typeof body?.mediaType === "string" ? body.mediaType.trim().toLowerCase() : "";
  if (!MEDIA_TYPES.has(mediaType)) {
    return Response.json({ message: "mediaType is required." }, { status: 400 });
  }

  const status = typeof body?.status === "string" ? body.status.trim().toLowerCase() : "";
  if (!STATUSES.has(status)) {
    return Response.json({ message: "status is required." }, { status: 400 });
  }

  const payload: Record<string, unknown> = { mediaType, status };

  const mediaId = body?.mediaId;
  if (typeof mediaId === "number" && Number.isInteger(mediaId) && mediaId > 0) {
    payload.mediaId = mediaId;
  } else {
    const externalSource = typeof body?.externalSource === "string" ? body.externalSource.trim() : "";
    const externalId = typeof body?.externalId === "string" ? body.externalId.trim() : "";
    if (!externalSource || !externalId) {
      return Response.json(
        { message: "Provide mediaId or externalSource + externalId." },
        { status: 400 },
      );
    }
    payload.externalSource = externalSource;
    payload.externalId = externalId;
  }

  return fetchProtected("/me/library", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
