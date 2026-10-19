import { fetchProtected } from "@/lib/api/protected";

const MEDIA_TYPES = new Set(["movie", "series", "game", "anime", "manga"]);
const SOURCES = new Set(["tmdb", "anilist", "igdb"]);

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const mediaType = (body as { mediaType?: unknown } | null)?.mediaType;
  const externalSource = (body as { externalSource?: unknown } | null)?.externalSource;
  const externalId = (body as { externalId?: unknown } | null)?.externalId;

  if (typeof mediaType !== "string" || !MEDIA_TYPES.has(mediaType)) {
    return Response.json({ message: "Invalid media type." }, { status: 400 });
  }

  if (typeof externalSource !== "string" || !SOURCES.has(externalSource)) {
    return Response.json({ message: "Invalid external source." }, { status: 400 });
  }

  if (typeof externalId !== "string" || externalId.trim().length === 0) {
    return Response.json({ message: "An external id is required." }, { status: 400 });
  }

  return fetchProtected("/admin/media/sync", {
    method: "POST",
    body: JSON.stringify({
      mediaType,
      externalSource,
      externalId: externalId.trim(),
    }),
  });
}
