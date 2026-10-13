import { fetchProtected } from "@/lib/api/protected";

// Friend list of another user. 403 when their account is private
// and you're not mutual friends.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!username.trim()) {
    return Response.json({ message: "Username is required." }, { status: 400 });
  }
  return fetchProtected(
    `/users/${encodeURIComponent(username.trim())}/friends`,
  );
}
