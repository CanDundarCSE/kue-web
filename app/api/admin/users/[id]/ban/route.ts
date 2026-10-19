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
  const isBanned = (body as { isBanned?: unknown } | null)?.isBanned;
  const rawReason = (body as { reason?: unknown } | null)?.reason;

  if (typeof isBanned !== "boolean") {
    return Response.json({ message: "A ban state is required." }, { status: 400 });
  }

  if (rawReason !== undefined && rawReason !== null && typeof rawReason !== "string") {
    return Response.json({ message: "Invalid ban reason." }, { status: 400 });
  }

  const reason = typeof rawReason === "string" ? rawReason.slice(0, 500) : null;

  return fetchProtected(`/admin/users/${id}/ban`, {
    method: "PUT",
    body: JSON.stringify({ isBanned, reason }),
  });
}
