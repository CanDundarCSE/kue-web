import { fetchProtected } from "@/lib/api/protected";

// Per-day added/completed counts for the profile's recent-activity panel.
// The backend clamps to 1-365 days; the client defaults to 30.
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("days");
  let days = requested !== null ? Number(requested) : 30;
  if (!Number.isInteger(days)) days = 30;
  days = Math.min(365, Math.max(1, days));

  return fetchProtected(`/me/stats/activity?days=${days}`);
}
