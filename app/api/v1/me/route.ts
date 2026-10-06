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

