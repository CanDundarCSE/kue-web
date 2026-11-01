import { fetchProtected } from "@/lib/api/protected";

// Reviews another user has published. 403 when their account is private and
// you are not mutual friends.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!username.trim()) {
    return Response.json({ message: "Username is required." }, { status: 400 });
  }

  const url = new URL(_request.url);
  const page = url.searchParams.get("page") ?? "1";
  const pageSize = url.searchParams.get("pageSize") ?? "10";

  return fetchProtected(
    `/users/${encodeURIComponent(username.trim())}/reviews?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
  );
}
