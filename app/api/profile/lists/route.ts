import { fetchProtected } from "@/lib/api/protected";

const VISIBILITIES = new Set(["public", "friends", "private"]);

// The signed-in user's lists, including private ones. The backend caps
// pageSize at 50.
export async function GET() {
  return fetchProtected("/me/lists?page=1&pageSize=50");
}

// Create a new list for the signed-in user.
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length === 0 || name.length > 150) {
    return Response.json(
      { message: "name is required (1-150 characters)." },
      { status: 400 },
    );
  }

  const payload: Record<string, unknown> = { name };

  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  if (description.length > 0) {
    if (description.length > 1000) {
      return Response.json(
        { message: "description must be at most 1000 characters." },
        { status: 400 },
      );
    }
    payload.description = description;
  }

  const visibility = typeof body?.visibility === "string" ? body.visibility.trim().toLowerCase() : "";
  if (visibility) {
    if (!VISIBILITIES.has(visibility)) {
      return Response.json(
        { message: "visibility must be one of: public, friends, private." },
        { status: 400 },
      );
    }
    payload.visibility = visibility;
  } else {
    // Legacy clients still send a boolean; everything else defaults to public.
    payload.visibility = body?.isPublic === false ? "private" : "public";
  }

  return fetchProtected("/me/lists", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
