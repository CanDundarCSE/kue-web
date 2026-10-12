import { fetchProtected } from "@/lib/api/protected";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") === "outgoing" ? "outgoing" : "incoming";
  return fetchProtected(`/friends/requests/${kind}`);
}
