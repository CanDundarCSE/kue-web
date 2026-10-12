import { fetchProtected } from "@/lib/api/protected";

function validId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ requestId: string; action: string }> },
) {
  const { requestId, action } = await context.params;
  const id = validId(requestId);
  if (id === null || (action !== "accept" && action !== "decline")) {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  return fetchProtected(`/friends/requests/${id}/${action}`, { method: "POST" });
}
