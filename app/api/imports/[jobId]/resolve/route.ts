import { fetchProtected } from "@/lib/api/protected";

function validId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Record conflict resolutions (bulk default + per-item overrides) and apply.
export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const id = validId(jobId);
  if (id === null) {
    return Response.json({ message: "Invalid import job." }, { status: 400 });
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const bulkDefault = body?.bulkDefault === "import" ? "import" : "keep";
  const overrides: Record<number, string> = {};
  if (body?.overrides && typeof body.overrides === "object" && !Array.isArray(body.overrides)) {
    for (const [key, value] of Object.entries(body.overrides as Record<string, unknown>)) {
      const itemId = Number(key);
      if (
        Number.isInteger(itemId) &&
        itemId > 0 &&
        (value === "keep" || value === "import" || value === "skip")
      ) {
        overrides[itemId] = value;
      }
    }
  }

  return fetchProtected(`/me/imports/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ bulkDefault, overrides }),
  });
}
