import type { Metadata } from "next";

import ImportView from "@/app/features/import/import-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import — Kue",
  description: "Import your list from MyAnimeList, AniList, Trakt or a CSV file into Kue.",
};

export default function ImportPage() {
  return <ImportView />;
}
