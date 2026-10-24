import { fetchProtected } from "@/lib/api/protected";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const candidateId = Number(id);
  if (!Number.isInteger(candidateId) || candidateId <= 0) {
    return Response.json({ message: "Invalid candidate id." }, { status: 400 });
  }

  return fetchProtected(`/me/playback-candidates/${candidateId}`, {
    method: "DELETE",
  });
}
