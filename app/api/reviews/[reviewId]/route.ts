import { buildReviewPayload } from "@/lib/api/reviews";
import { fetchProtected } from "@/lib/api/protected";

// Update one of the signed-in user's own reviews.
export async function PUT(
  request: Request,
  context: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await context.params;

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
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

  return fetchProtected(`/me/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await context.params;
  return fetchProtected(`/me/reviews/${reviewId}`, { method: "DELETE" });
}