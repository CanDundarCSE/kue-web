type ApiErrorBody = {
  message?: unknown;
  title?: unknown;
  errors?: unknown;
};

function firstErrorMessage(errors: unknown) {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors as Record<string, unknown>)) {
    const messages = Array.isArray(value) ? value : [value];
    const first = messages.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    if (first) return first;
  }

  return null;
}

export function formatApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const body = data as ApiErrorBody;

  if (typeof body.message === "string" && body.message.trim()) return body.message;

  // ASP.NET model validation puts the actionable text in `errors`; `title` is
  // only the generic "One or more validation errors occurred." wrapper.
  const fieldMessage = firstErrorMessage(body.errors);
  if (fieldMessage) return fieldMessage;

  if (typeof body.title === "string" && body.title.trim()) return body.title;

  return fallback;
}

export async function readApiError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return formatApiError(data, fallback);
}
