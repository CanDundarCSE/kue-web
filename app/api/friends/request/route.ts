import { fetchProtected } from "@/lib/api/protected";

// Send a friend request by Kue ID or username. The backend handles
// duplicates, auto-accept and re-open with friendly messages.
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const kueId = typeof body?.kueId === "string" ? body.kueId.trim() : "";
  if (kueId) {
    return fetchProtected(`/friends/request/by-kueid/${encodeURIComponent(kueId)}`, {
      method: "POST",
    });
  }

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  if (username) {
    return fetchProtected(`/friends/request/${encodeURIComponent(username)}`, {
      method: "POST",
    });
  }

  return Response.json({ message: "kueId or username is required." }, { status: 400 });
}
