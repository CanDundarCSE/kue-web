import type { Metadata } from "next";

import MediaReviewsView from "@/app/features/reviews/media-reviews-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews — Kue",
  description: "Read what the community thinks about this title on Kue.",
};

const SORTS = new Set(["newest", "oldest", "highest", "lowest"]);

function firstString(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single : "";
}

export default async function MediaReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const mediaId = Number(id);

  const rawSort = firstString(query.sort).trim().toLowerCase();
  const sort = SORTS.has(rawSort) ? rawSort : "newest";

  const hideSpoilers = firstString(query.spoilers).trim().toLowerCase() === "hidden";

  const rawPage = Number.parseInt(firstString(query.page), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <MediaReviewsView
      mediaId={Number.isInteger(mediaId) && mediaId > 0 ? mediaId : 0}
      sort={sort}
      hideSpoilers={hideSpoilers}
      page={page}
    />
  );
}
