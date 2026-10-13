import { fetchProtected } from "@/lib/api/protected";

const MAX_CHARS = 2_000_000;
const MAX_FILES = 50;
const MAX_TOTAL_CHARS = 5_000_000;

// Start a background import from an export file's text content,
// or from multiple Trakt .json texts (never zip archives).
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const rawFiles = Array.isArray(body?.files) ? body.files : null;
  if (rawFiles !== null) {
    if (rawFiles.length === 0 || rawFiles.length > MAX_FILES) {
      return Response.json(
        { message: `Send between 1 and ${MAX_FILES} files.` },
        { status: 400 },
      );
    }
    const files: { fileName: string; content: string }[] = [];
    let total = 0;
    for (const entry of rawFiles) {
      if (typeof entry !== "object" || entry === null) {
        return Response.json({ message: "Each file needs a fileName and content." }, { status: 400 });
      }
      const record = entry as Record<string, unknown>;
      const fileName = typeof record.fileName === "string" ? record.fileName.slice(0, 300) : "";
      const content = typeof record.content === "string" ? record.content : "";
      if (fileName.toLowerCase().endsWith(".zip") || (content[0] === "P" && content[1] === "K")) {
        return Response.json(
          { message: "Zip archives aren't accepted. Unzip the Trakt export first and select the .json files." },
          { status: 400 },
        );
      }
      if (content.length > MAX_CHARS) {
        return Response.json({ message: `'${fileName || "A file"}' is too large (2 MB max per file).` }, { status: 413 });
      }
      total += content.length;
      if (total > MAX_TOTAL_CHARS) {
        return Response.json({ message: "These files are too large in total (5 MB max)." }, { status: 413 });
      }
      files.push({ fileName, content });
    }

    const payload: Record<string, unknown> = {
      fileName: typeof body?.fileName === "string" ? body.fileName.slice(0, 300) : `Trakt export (${files.length} files)`,
      content: "",
      files,
    };
    if (typeof body?.source === "string" && body.source.trim()) {
      payload.source = body.source.trim();
    }

    return fetchProtected("/me/imports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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
