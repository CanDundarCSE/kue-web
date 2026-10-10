import { authFetch, readApiError } from "@/lib/api/client";

export const REVIEW_MAX_LENGTH = 255;

export type ReviewDto = {
  id: number;
  userId: number;
  username: string;
  mediaId: number;
  mediaTitle: string;
  mediaType: string;
  mediaCoverImage: string;
  mediaYear?: number | null;
  content: string;
  rating?: number | null;
  containsSpoilers: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type PagedResponseDto<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ReviewPayload = {
  content: string;
  rating: number | null;
  containsSpoilers: boolean;
  isPublic: boolean;
};

export type ReviewPage = {
  items: ReviewDto[];
  totalItems: number;
  totalPages: number;
};

export function buildReviewPayload(input: {
  content: string;
  rating?: number | null;
  containsSpoilers?: boolean;
  isPublic?: boolean;
}): ReviewPayload {
  const content = input.content.trim();
  const rating =
    typeof input.rating === "number" && input.rating >= 1 && input.rating <= 10
      ? Math.round(input.rating)
      : null;

  return {
    content,
    rating,
    containsSpoilers: input.containsSpoilers === true,
    isPublic: input.isPublic !== false,
  };
}

export async function fetchMyReviews(params?: {
  page?: number;
  pageSize?: number;
  isPublic?: boolean | null;
}): Promise<ReviewPage | null> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.isPublic !== undefined && params.isPublic !== null) {
    query.set("isPublic", String(params.isPublic));
  }

  const qs = query.toString();
  const response = await authFetch(`/api/reviews${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  }).catch(() => null);

  if (!response || !response.ok) return null;

  const data = (await response.json().catch(() => null)) as {
    items?: ReviewDto[];
    totalItems?: number;
    totalPages?: number;
  } | null;

  if (!data || !Array.isArray(data.items)) return null;

  const items = data.items;
  return {
    items,
    totalItems: typeof data.totalItems === "number" ? data.totalItems : items.length,
    totalPages:
      typeof data.totalPages === "number"
        ? data.totalPages
        : Math.max(1, Math.ceil(items.length / (params?.pageSize ?? 20))),
  };
}

export async function createReview(
  mediaId: number,
  payload: ReviewPayload,
): Promise<{ review: ReviewDto | null; error: string | null }> {
  const response = await authFetch("/api/reviews", {
    method: "POST",
    body: JSON.stringify({ mediaId, ...payload }),
  }).catch(() => null);

  if (!response) return { review: null, error: "Couldn&rsquo;t reach the server." };

  if (response.status === 201) {
    return { review: (await response.json().catch(() => null)) as ReviewDto, error: null };
  }

  return { review: null, error: await readApiError(response, "Couldn&rsquo;t save the review.") };
}

export async function updateReview(
  reviewId: number,
  payload: ReviewPayload,
): Promise<{ review: ReviewDto | null; error: string | null }> {
  const response = await authFetch(`/api/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!response) return { review: null, error: "Couldn&rsquo;t reach the server." };

  if (response.ok) {
    return { review: (await response.json().catch(() => null)) as ReviewDto, error: null };
  }

  return { review: null, error: await readApiError(response, "Couldn&rsquo;t update the review.") };
}

export async function deleteReview(reviewId: number): Promise<string | null> {
  const response = await authFetch(`/api/reviews/${reviewId}`, { method: "DELETE" }).catch(
    () => null,
  );

  if (!response) return "Couldn&rsquo;t reach the server.";
  if (response.ok) return null;

  return readApiError(response, "Couldn&rsquo;t delete the review.");
}