import { fetchProtected } from "@/lib/api/protected";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId) || notificationId < 1) {
    return Response.json({ message: "Invalid notification id." }, { status: 400 });
  }
  return fetchProtected(`/me/notifications/${notificationId}/read`, { method: "PUT" });
}
