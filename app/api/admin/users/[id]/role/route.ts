import { fetchProtected } from "@/lib/api/protected";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ message: "Invalid user id." }, { status: 400 });
  }

  const body: unknown = await request.json().catch(() => null);
  const roles = (body as { roles?: unknown } | null)?.roles;

  if (
    !Array.isArray(roles) ||
    roles.length === 0 ||
    roles.some(
      (role) => typeof role !== "string" || role.length === 0 || role.length > 50,
    )
  ) {
    return Response.json({ message: "A non-empty list of roles is required." }, { status: 400 });
  }

  return fetchProtected(`/admin/users/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}
