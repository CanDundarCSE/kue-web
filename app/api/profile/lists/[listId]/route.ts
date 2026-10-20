import { fetchProtected } from "@/lib/api/protected";

// Single list owned by the signed-in user, with its items. Uses the
// authenticated `/me/lists/{id}` route so an expired access token returns 401
// and the client interceptor can rotate and retry.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const id = Number(listId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid list id." }, { status: 400 });
  }

  return fetchProtected(`/me/lists/${id}`);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const id = Number(listId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid list id." }, { status: 400 });
  }

  const body = await request.text();
  return fetchProtected(`/me/lists/${id}`, { method: "PUT", body });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const id = Number(listId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid list id." }, { status: 400 });
  }

  return fetchProtected(`/me/lists/${id}`, { method: "DELETE" });
}
