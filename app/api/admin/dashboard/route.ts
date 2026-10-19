import { fetchProtected } from "@/lib/api/protected";

export async function GET() {
  return fetchProtected("/admin/dashboard");
}
