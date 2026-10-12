import { authFetch, readApiError } from "@/lib/api/client";

export type ImportJobDto = {
  id: number;
  source: string;
  fileName: string;
  status: string;
  totalItems: number;
  processedItems: number;
  conflictCount: number;
  readyCount: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  error?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type FieldConflictDto = {
  field: string;
  local?: string | null;
  imported?: string | null;
};

export type ImportItemDto = {
  id: number;
  title: string;
  mediaType?: string | null;
  importedStatus?: string | null;
  importedProgress?: number | null;
  importedRating?: number | null;
  importedPlatform?: string | null;
  importedFavorite?: boolean | null;
  matchedMediaId?: number | null;
  conflicts: FieldConflictDto[];
  status: string;
  decision?: string | null;
  error?: string | null;
};

export type ImportJobDetailsDto = ImportJobDto & {
  items: ImportItemDto[];
};

export const TERMINAL_IMPORT_STATUSES = new Set([
  "completed",
  "failed",
  "cancelled",
]);

export async function startImport(input: {
  fileName: string;
  content: string;
  source?: string | null;
}): Promise<{ job: ImportJobDto | null; error: string | null }> {
  const response = await authFetch("/api/imports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => null);

  if (!response) return { job: null, error: "Couldn't reach the server." };
  if (response.status === 201) {
    return { job: (await response.json().catch(() => null)) as ImportJobDto, error: null };
  }
  return { job: null, error: await readApiError(response, "Couldn't start the import.") };
}

export async function fetchImportJobs(): Promise<ImportJobDto[] | null> {
  const response = await authFetch("/api/imports", { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return null;
  const data: unknown = await response.json().catch(() => null);
  return Array.isArray(data) ? (data as ImportJobDto[]) : null;
}

export async function fetchImportJob(jobId: number): Promise<ImportJobDetailsDto | null> {
  const response = await authFetch(`/api/imports/${jobId}`, { cache: "no-store" }).catch(
    () => null,
  );
  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as ImportJobDetailsDto | null;
}

export async function resolveImport(
  jobId: number,
  bulkDefault: "keep" | "import",
  overrides: Record<number, "keep" | "import" | "skip">,
): Promise<{ job: ImportJobDto | null; error: string | null }> {
  const response = await authFetch(`/api/imports/${jobId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bulkDefault, overrides }),
  }).catch(() => null);

  if (!response) return { job: null, error: "Couldn't reach the server." };
  if (response.ok) {
    return { job: (await response.json().catch(() => null)) as ImportJobDto, error: null };
  }
  return { job: null, error: await readApiError(response, "Couldn't apply resolutions.") };
}

export async function cancelImport(jobId: number): Promise<string | null> {
  const response = await authFetch(`/api/imports/${jobId}`, {
    method: "DELETE",
  }).catch(() => null);

  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;
  return readApiError(response, "Couldn't cancel the import.");
}
