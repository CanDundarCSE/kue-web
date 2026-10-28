import type { Metadata } from "next";

import FriendsView from "@/app/features/friends/friends-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Friends — Kue",
  description: "Find friends by Kue ID, manage requests, and share your code on Kue.",
};

function firstString(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single : "";
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Deep link from a scanned QR code (?add=KUE-XXXXXX).
  const initialKueId = firstString(params.add).trim();

  return <FriendsView initialKueId={initialKueId} />;
}
