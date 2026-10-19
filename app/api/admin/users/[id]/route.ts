import { fetchProtected } from "@/lib/api/protected";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ message: "Invalid user id." }, { status: 400 });
  }

  return fetchProtected(`/admin/users/${id}`);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ message: "Invalid user id." }, { status: 400 });
  }

  return fetchProtected(`/admin/users/${id}`, { method: "DELETE" });
}
