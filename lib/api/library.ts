import { fetchProtected } from "@/lib/api/protected";

export function fetchContinue(): Promise<Response> {
  return fetchProtected("/me/library/continue");
}

export function updateProgress(mediaId: number, progress: number): Promise<Response> {
  return fetchProtected(`/me/library/${mediaId}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress }),
  });
}
