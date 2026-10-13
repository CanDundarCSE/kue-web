import { fetchProtected } from "@/lib/api/protected";

// Friends activity feed: recent activity of accepted mutual friends.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let page = Number(params.get("page") ?? 1);
  if (!Number.isInteger(page) || page < 1) page = 1;
  let pageSize = Number(params.get("pageSize") ?? 20);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) pageSize = 20;

  return fetchProtected(`/friends/activity?page=${page}&pageSize=${pageSize}`);
}
