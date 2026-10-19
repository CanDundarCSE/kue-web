import { fetchProtected } from "@/lib/api/protected";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ message: "Invalid media id." }, { status: 400 });
  }

  return fetchProtected(`/admin/media/${id}/restore`, { method: "PUT" });
}
