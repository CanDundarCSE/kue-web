import { fetchProtected } from "@/lib/api/protected";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  return fetchProtected(`/me/mini-games/leaderboard${qs ? `?${qs}` : ""}`);
}
