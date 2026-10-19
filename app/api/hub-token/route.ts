import { fetchProtected } from "@/lib/api/protected";

// Mints the short-lived token the browser uses for its SignalR connection.
// Runs on the same origin as the app, so the HttpOnly access-token cookie is
// available server-side and never has to be exposed to JavaScript.
export async function POST() {
  return fetchProtected("/me/hub-token", { method: "POST" });
}
