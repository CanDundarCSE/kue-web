import { fetchProtected } from "@/lib/api/protected";

// Recent activity of another user. 403 when their account is private
// and you're not mutual friends.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!username.trim()) {
    return Response.json({ message: "Username is required." }, { status: 400 });
  }
  const requested = new URL(request.url).searchParams.get("days");
  let days = requested !== null ? Number(requested) : 30;
  if (!Number.isInteger(days)) days = 30;
  days = Math.min(365, Math.max(1, days));

  return fetchProtected(
    `/users/${encodeURIComponent(username.trim())}/activity?days=${days}&limit=20`,
  );
}
