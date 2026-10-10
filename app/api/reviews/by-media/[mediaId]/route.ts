import { fetchProtected } from "@/lib/api/protected";

// The signed-in user's own review for a given media, if any. Used to decide
// between "Write a review" and "Edit" when picking from the library.
export async function GET(
  _request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  return fetchProtected(`/me/reviews/by-media/${mediaId}`);
}