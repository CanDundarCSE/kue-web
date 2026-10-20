import { fetchProtected } from "@/lib/api/protected";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ listId: string; mediaId: string }> },
) {
  const { listId, mediaId } = await params;
  const list = Number(listId);
  const media = Number(mediaId);
  if (!Number.isInteger(list) || list <= 0 || !Number.isInteger(media) || media <= 0) {
    return Response.json({ message: "Invalid list or media id." }, { status: 400 });
  }

  const body = await request.text();
  return fetchProtected(`/me/lists/${list}/items/${media}`, { method: "PUT", body });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listId: string; mediaId: string }> },
) {
  const { listId, mediaId } = await params;
  const list = Number(listId);
  const media = Number(mediaId);
  if (!Number.isInteger(list) || list <= 0 || !Number.isInteger(media) || media <= 0) {
    return Response.json({ message: "Invalid list or media id." }, { status: 400 });
  }

  return fetchProtected(`/me/lists/${list}/items/${media}`, { method: "DELETE" });
}
