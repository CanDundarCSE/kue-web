import { fetchProtected } from "@/lib/api/protected";

const MAX_CHARS = 2_000_000;

// Start a background import from an export file's text content.
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const content = typeof body?.content === "string" ? body.content : "";
  if (!content.trim()) {
    return Response.json({ message: "File content is required." }, { status: 400 });
  }
  if (content.length > MAX_CHARS) {
    return Response.json({ message: "File is too large (2 MB max)." }, { status: 413 });
  }

  const payload: Record<string, unknown> = {
    fileName: typeof body?.fileName === "string" ? body.fileName.slice(0, 300) : "",
    content,
  };
  if (typeof body?.source === "string" && body.source.trim()) {
    payload.source = body.source.trim();
  }

  return fetchProtected("/me/imports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function GET() {
  return fetchProtected("/me/imports");
}
