import { fetchProtected } from "@/lib/api/protected";

export type LibraryMediaDto = {
  id: number;
  title: string;
  mediaType: string;
  coverImage?: string | null;
  year?: number | null;
  score?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  runtimeMinutes?: number | null;
  platforms?: string[] | null;
};

export type LibraryEntryDto = {
  id: number;
  userId: number;
  mediaId: number;
  mediaType: string;
  status: string;
  isFavorite: boolean;
  rating?: number | null;
  platform?: string | null;
  progress?: number | null;
  totalUnits?: number | null;
  unitName?: string | null;
  addedAt: string;
  updatedAt?: string | null;
  completedAt?: string | null;
  media: LibraryMediaDto;
};

export type PagedResponseDto<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type UpdateLibraryParams = {
  status?: string;
  progress?: number;
  rating?: number;
  platform?: string;
  isFavorite?: boolean;
};

export function fetchContinue(): Promise<Response> {
  return fetchProtected("/me/library/continue");
}

export function fetchLibrary(params?: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<Response> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));

  const qs = query.toString();
  return fetchProtected(`/me/library${qs ? `?${qs}` : ""}`);
}

export function updateProgress(mediaId: number, progress: number): Promise<Response> {
  return fetchProtected(`/me/library/${mediaId}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress }),
  });
}
