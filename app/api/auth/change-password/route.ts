import { fetchProtected } from "@/lib/api/protected";

// Change the signed-in user's password. Complexity rules are enforced by the
// backend; its message is surfaced verbatim to the form.
export async function POST(request: Request) {
  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }

  return fetchProtected("/auth/change-password", {
    method: "POST",
    body,
  });
}
