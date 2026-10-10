import { API_BASE_URL } from "@/lib/api/backend";
import { NO_STORE } from "@/lib/api/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(
    20,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );

  let upstream: Response;
  try {
    upstream = await fetch(
      `${API_BASE_URL}/api/v1/media/top?pageSize=${pageSize}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
  } catch {
    return Response.json(
      { message: "Cannot reach the Kue API." },
      { status: 502, headers: NO_STORE },
    );
  }

  const payload = await upstream.json().catch(() => null);
  return Response.json(
    payload ?? { message: "Cannot reach the Kue API." },
    { status: upstream.status, headers: NO_STORE },
  );
}

