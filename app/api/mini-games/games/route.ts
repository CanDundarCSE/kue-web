import { fetchProtected } from "@/lib/api/protected";

export async function POST(request: Request) {
  const body = await request.text().catch(() => "");
  return fetchProtected("/me/mini-games/games", {
    method: "POST",
    body,
  });
}
