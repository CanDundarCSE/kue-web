import { NO_STORE } from "@/lib/api/auth";
import { fetchProtected } from "@/lib/api/protected";

// Favorites have no dedicated backend endpoint: they are the IsFavorite flag
// on library entries. Page through /me/library at the backend's maximum page
// size, keep the favorites, and return one flat list so the client makes a
// single round trip.
const PAGE_SIZE = 100;
const MAX_PAGES = 25;

export async function GET() {
  const favorites: unknown[] = [];

  for (let page = 1; ; page += 1) {
    const response = await fetchProtected(
      `/me/library?page=${page}&pageSize=${PAGE_SIZE}`,
    );
    if (!response.ok) return response;

    const data = (await response.json()) as {
      items?: { isFavorite?: boolean }[];
      totalPages?: number;
    };
    const items = Array.isArray(data.items) ? data.items : [];
    for (const entry of items) {
      if (entry.isFavorite === true) favorites.push(entry);
    }

    if (page >= (data.totalPages ?? 1) || items.length < PAGE_SIZE || page >= MAX_PAGES) {
      break;
    }
  }

  return Response.json(
    { items: favorites, totalItems: favorites.length },
    { headers: NO_STORE },
  );
}
