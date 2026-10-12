import { fetchProtected } from "@/lib/api/protected";

function validId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const id = validId(jobId);
  if (id === null) {
    return Response.json({ message: "Invalid import job." }, { status: 400 });
  }

  return fetchProtected(`/me/imports/${id}`);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const id = validId(jobId);
  if (id === null) {
    return Response.json({ message: "Invalid import job." }, { status: 400 });
  }

  return fetchProtected(`/me/imports/${id}`, { method: "DELETE" });
}
