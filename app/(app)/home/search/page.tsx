import type { Metadata } from "next";

import SearchResults from "@/app/features/search/search-results";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search — Kue",
  description: "Browse the full Kue catalog — movies, series, games, anime and manga.",
};

const MEDIA_TYPES = new Set(["movie", "series", "game", "anime", "manga"]);
const SORTS = new Set(["newest", "oldest", "highest", "lowest"]);

function firstString(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single : "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const query = firstString(params.q).trim();
  const rawType = firstString(params.type).trim().toLowerCase();
  const type = MEDIA_TYPES.has(rawType) ? rawType : "";

  const rawPage = Number.parseInt(firstString(params.page), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawSort = firstString(params.sort).trim().toLowerCase();
  const sort = SORTS.has(rawSort) ? rawSort : "";

  const rawYear = Number.parseInt(firstString(params.year), 10);
  const year =
    Number.isInteger(rawYear) && rawYear >= 1800 && rawYear <= 2100 ? rawYear : null;

  const rawMinScore = Number(firstString(params.minScore));
  const minScore =
    Number.isFinite(rawMinScore) && rawMinScore >= 0 && rawMinScore <= 10
      ? rawMinScore
      : null;

  return <SearchResults query={query} type={type} page={page} sort={sort} year={year} minScore={minScore} />;
}
