import { fetchProtected } from "@/lib/api/protected";

export async function GET() {
  return fetchProtected("/me/addon/credentials");
}

export async function POST(request: Request) {
  const body = await request.text();
  return fetchProtected("/me/addon/credentials", {
    method: "POST",
    body: body || "{}",
  });
}

export async function DELETE() {
  return fetchProtected("/me/addon/credentials", { method: "DELETE" });
}
