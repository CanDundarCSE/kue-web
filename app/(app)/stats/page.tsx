import type { Metadata } from "next";
import { cache } from "react";

import StatsPage from "@/app/features/stats/stats-page";

export const metadata: Metadata = {
  title: "Stats — Kue",
  description:
    "Your habits, in numbers. Track your hours, media breakdown, genres, streaks, and activity.",
};

export const dynamic = "force-dynamic";

const getServerTimestamp = cache(() => Date.now());

export default function StatsPageRoute() {
  return <StatsPage now={getServerTimestamp()} />;
}

