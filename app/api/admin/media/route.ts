import { fetchProtected } from "@/lib/api/protected";

const ALLOWED_PARAMS = new Set([
  "search",
  "mediaType",
  "externalSource",
  "includeDeleted",
  "page",
  "pageSize",
]);

export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();

  for (const [key, value] of incoming) {
    if (ALLOWED_PARAMS.has(key)) forwarded.append(key, value);
  }

  const query = forwarded.toString();
  return fetchProtected(`/admin/media${query ? `?${query}` : ""}`);
}
