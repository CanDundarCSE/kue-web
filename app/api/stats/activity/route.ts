import { fetchProtected } from "@/lib/api/protected";

// This-week activity for the dashboard card: per-day added/completed counts
// for the last 7 days.
export async function GET() {
  return fetchProtected("/me/stats/activity?days=7");
}
