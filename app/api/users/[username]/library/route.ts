import { fetchProtected } from "@/lib/api/protected";

// Library entries of another user (first page, up to 50). 403 when their
// account is private and you're not mutual friends. Used for the public
// profile's favorites strip.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!username.trim()) {
    return Response.json({ message: "Username is required." }, { status: 400 });
  }
  return fetchProtected(
    `/users/${encodeURIComponent(username.trim())}/library?page=1&pageSize=50`,
  );
}
