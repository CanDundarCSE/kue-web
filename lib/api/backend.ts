const RAW_BASE_URL = process.env.KUE_API_URL ?? "http://localhost:5148";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export const AUTH_BASE_PATH = "/api/v1/auth";

const REFRESH_COOKIE_NAME = "refreshtoken";

// The API scopes the refresh cookie to its own `/api/v1/auth` prefix. The browser
// stores it against this origin instead, so the path has to be rewritten or the
// cookie is never sent back to the Next.js routes.
const REFRESH_COOKIE_PATH = "/api/auth";

function jsonResponse(status: number, body: unknown, setCookie: string[] = []) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });

  for (const cookie of setCookie) {
    headers.append("Set-Cookie", cookie);
  }

  return new Response(JSON.stringify(body), { status, headers });
}

function normalizeSetCookies(cookies: string[]) {
  return cookies.map((cookie) => {
    const name = cookie.slice(0, cookie.indexOf("=")).trim().toLowerCase();
    if (name !== REFRESH_COOKIE_NAME) return cookie;
    return cookie.replace(/;\s*path=[^;]*/i, `; Path=${REFRESH_COOKIE_PATH}`);
  });
}

async function readBody(request: Request) {
  try {
    const raw = await request.text();
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

type ProxyOptions = {
  path: string;
  fields: readonly string[];
  validationError: string;
  unavailableError: string;
};

export async function proxyAuthPost(request: Request, options: ProxyOptions) {
  const body = await readBody(request);

  if (!body) {
    return jsonResponse(400, { message: options.validationError });
  }

  const payload: Record<string, string> = {};
  for (const field of options.fields) {
    const value = pickString(body, field);
    if (!value) {
      return jsonResponse(400, { message: `${field} is required` });
    }
    payload[field] = value;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}${AUTH_BASE_PATH}/${options.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return jsonResponse(502, { message: options.unavailableError });
  }

  const text = await upstream.text().catch(() => "");

  let parsedBody: unknown = null;
  try {
    parsedBody = text ? JSON.parse(text) : null;
  } catch {
    parsedBody = null;
  }

  return jsonResponse(
    upstream.status,
    parsedBody ?? { message: options.unavailableError },
    normalizeSetCookies(upstream.headers.getSetCookie()),
  );
}
