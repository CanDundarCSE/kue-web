import type { Metadata } from "next";

import DiscoverView from "@/app/features/discover/discover-view";

export const metadata: Metadata = {
  title: "Discover — Kue",
  description:
    "Films, series, games, anime and manga in a single search from TMDB, AniList and IGDB.",
};

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single : "";
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = firstString(params.q).trim();

  return <DiscoverView initialQuery={query} />;
}
