import { fetchProtected } from "@/lib/api/protected";

// Re-acceptance of the current legal documents. The version is validated on
// the backend against Constants/LegalVersion.Current.
export async function POST(request: Request) {
  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }

  return fetchProtected("/me/terms", {
    method: "POST",
    body,
  });
}
