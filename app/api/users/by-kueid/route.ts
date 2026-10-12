import { fetchProtected } from "@/lib/api/protected";

// Look up a public profile by Kue ID (prefix optional).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kueId = searchParams.get("kueId")?.trim() ?? "";

  if (!kueId) {
    return Response.json({ message: "kueId is required." }, { status: 400 });
  }

  return fetchProtected(`/users/by-kueid/${encodeURIComponent(kueId)}`);
}
