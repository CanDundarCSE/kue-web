import type { Metadata } from "next";
import MediaDetailView from "@/app/features/media/media-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Media Details — Kue",
    description: `View details, track progress, and manage status for media ${id} on Kue.`,
  };
}

export const dynamic = "force-dynamic";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mediaId = Number(id);

  return <MediaDetailView mediaId={mediaId} />;
}

