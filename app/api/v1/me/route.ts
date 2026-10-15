import { cookies } from "next/headers";

import { clearSession, isSecureFromRequest } from "@/lib/api/auth";
import { fetchProtected } from "@/lib/api/protected";

export async function GET() {
  return fetchProtected("/me");
}

export async function PUT(request: Request) {
  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }

  return fetchProtected("/me", {
    method: "PUT",
    body,
  });
}

// Right to be forgotten: deletes the authenticated account and all owned data
// (cascade) on the backend, then clears the web session cookies so the browser
// is signed out locally too.
export async function DELETE(request: Request) {
  const response = await fetchProtected("/me", { method: "DELETE" });

  if (response.ok) {
    const cookieStore = await cookies();
    clearSession(cookieStore, isSecureFromRequest(request));
  }

  return response;
}

