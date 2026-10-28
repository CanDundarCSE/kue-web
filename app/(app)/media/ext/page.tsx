import type { Metadata } from "next";
import MediaDetailView from "@/app/features/media/media-detail-view";

export const metadata: Metadata = {
  title: "Media Details — Kue",
  description: "View details, track progress, and manage status on Kue.",
};

export const dynamic = "force-dynamic";

export default async function ExternalMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; id?: string; type?: string }>;
}) {
  const params = await searchParams;

  if (!params.source || !params.id || !params.type) {
    return <MediaDetailView mediaId={0} />;
  }

  return (
    <MediaDetailView
      externalParams={{
        source: params.source,
        id: params.id,
        type: params.type,
      }}
    />
  );
}

