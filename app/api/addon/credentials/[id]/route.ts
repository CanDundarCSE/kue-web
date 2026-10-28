import { fetchProtected } from "@/lib/api/protected";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const credentialId = Number(id);
  if (!Number.isInteger(credentialId) || credentialId <= 0) {
    return Response.json({ message: "Invalid credential id." }, { status: 400 });
  }

  return fetchProtected(`/me/addon/credentials/${credentialId}`, {
    method: "DELETE",
  });
}
