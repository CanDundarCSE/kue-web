import { fetchProtected } from "@/lib/api/protected";

// Paginated notifications for the signed-in user.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let page = Number(params.get("page") ?? 1);
  if (!Number.isInteger(page) || page < 1) page = 1;
  let pageSize = Number(params.get("pageSize") ?? 20);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) pageSize = 20;

  return fetchProtected(`/me/notifications?page=${page}&pageSize=${pageSize}`);
}

// Delete all notifications for the signed-in user.
export async function DELETE() {
  return fetchProtected("/me/notifications", { method: "DELETE" });
}
