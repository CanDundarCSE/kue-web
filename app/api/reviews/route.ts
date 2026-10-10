import { buildReviewPayload } from "@/lib/api/reviews";
import { fetchProtected } from "@/lib/api/protected";

// Reviews written by the signed-in user. `isPublic` filters by visibility.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  return fetchProtected(`/me/reviews${qs ? `?${qs}` : ""}`);
}

// Create a review. The backend enforces the 255-char limit and the
// one-review-per-media rule.
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const mediaId = body?.mediaId;
  if (typeof mediaId !== "number" || !Number.isInteger(mediaId) || mediaId <= 0) {
    return Response.json({ message: "mediaId is required." }, { status: 400 });
  }

  const payload = buildReviewPayload({
    content: typeof body?.content === "string" ? body.content : "",
    rating: typeof body?.rating === "number" ? body.rating : null,
    containsSpoilers: body?.containsSpoilers === true,
    isPublic: body?.isPublic !== false,
  });

  if (!payload.content) {
    return Response.json({ message: "content is required." }, { status: 400 });
  }

  return fetchProtected("/me/reviews", {
    method: "POST",
    body: JSON.stringify({ mediaId, ...payload }),
  });
}