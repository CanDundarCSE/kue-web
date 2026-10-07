import { fetchProtected } from "@/lib/api/protected";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  const id = Number(mediaId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid media id." }, { status: 400 });
  }

  const body = await request.text();
  return fetchProtected(`/me/library/${id}/status`, {
    method: "PATCH",
    body,
  });
}

