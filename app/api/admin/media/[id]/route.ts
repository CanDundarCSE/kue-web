import { fetchProtected } from "@/lib/api/protected";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ message: "Invalid media id." }, { status: 400 });
  }

  const permanent = new URL(request.url).searchParams.get("permanent") === "true";
  return fetchProtected(`/admin/media/${id}?permanent=${permanent}`, { method: "DELETE" });
}
