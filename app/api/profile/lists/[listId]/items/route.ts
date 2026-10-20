import { fetchProtected } from "@/lib/api/protected";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const id = Number(listId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid list id." }, { status: 400 });
  }

  return fetchProtected(`/lists/${id}/items`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const id = Number(listId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid list id." }, { status: 400 });
  }

  const body = await request.text();
  return fetchProtected(`/me/lists/${id}/items`, { method: "POST", body });
}
