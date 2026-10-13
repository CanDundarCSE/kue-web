import { fetchProtected } from "@/lib/api/protected";

// Public profile header. The backend always returns the card fields;
// counts are null when the account is private and you're not friends.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!username.trim()) {
    return Response.json({ message: "Username is required." }, { status: 400 });
  }
  return fetchProtected(`/users/${encodeURIComponent(username.trim())}`);
}
