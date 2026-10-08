import { fetchProtected } from "@/lib/api/protected";

// Activity for the dashboard card or heatmap: per-day added/completed counts.
// Defaults to 7 days if unspecified.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") ?? "7";
  return fetchProtected(`/me/stats/activity?days=${days}`);
}

