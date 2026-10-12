import { fetchProtected } from "@/lib/api/protected";

// Remove a friend (or cancel a pending request) by username.
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;
  if (!username.trim()) {
    return Response.json({ message: "Username is required." }, { status: 400 });
  }

  return fetchProtected(`/friends/${encodeURIComponent(username)}`, {
    method: "DELETE",
  });
}
