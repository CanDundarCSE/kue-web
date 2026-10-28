import type { Metadata } from "next";

import MiniGamesView from "@/app/features/mini-games/mini-games-view";

export const metadata: Metadata = {
  title: "Mini-games — Kue",
  description: "Guess pixelated posters, earn points, spend them on hints, climb the leaderboard.",
};

export const dynamic = "force-dynamic";

export default function MiniGamesPage() {
  return <MiniGamesView />;
}
