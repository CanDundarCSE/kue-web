import { updateProgress } from "@/lib/api/library";

export async function POST(
  request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  const id = Number(mediaId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: "Invalid media id." }, { status: 400 });
  }

  let body: { progress?: unknown } | null = null;
  try {
    body = (await request.json()) as { progress?: unknown };
  } catch {
    body = null;
  }

  const progress = body?.progress;
  if (typeof progress !== "number" || !Number.isInteger(progress) || progress < 0) {
    return Response.json(
      { message: "Progress must be a non-negative number." },
      { status: 400 },
    );
  }

  return updateProgress(id, progress);
}
