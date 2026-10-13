import { fetchProtected } from "@/lib/api/protected";

export async function PUT() {
  return fetchProtected("/me/notifications/read-all", { method: "PUT" });
}
