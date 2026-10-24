import { fetchProtected } from "@/lib/api/protected";

export async function GET() {
  return fetchProtected("/me/addon/credentials");
}

export async function POST() {
  return fetchProtected("/me/addon/credentials", { method: "POST" });
}

export async function DELETE() {
  return fetchProtected("/me/addon/credentials", { method: "DELETE" });
}
